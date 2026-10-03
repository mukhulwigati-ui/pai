'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  RefreshCw,
  Save,
  School,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

const SCHOOL_LEVEL = 'SD';

const VALID_GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
];

/* ============================================================
   TYPES
============================================================ */

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type Subject = {
  id: number;
  name: string;
  level?: string | null;
};

type TP = {
  id: number;
  code: string;
  description: string;
};

type CP = {
  id: number;
  code: string;
  description: string;

  subjectId: number;

  grade?: number | null;
  semester?: number | null;

  subject?: {
    id?: number;
    name: string;
    level?: string | null;
  } | null;

  tps?: TP[];
};

type Student = {
  id: number;
  fullname: string;
  nisn?: string | null;
  class_name: string;
};

type Assessment = {
  id?: number;
  studentId: number;
  tpId?: number | null;
  score: number;
  type: string;

  student?: {
    id: number;
    fullname: string;
    class_name?: string | null;
  } | null;

  tp?: {
    id: number;
    cp?: {
      id?: number;
      subjectId?: number | null;

      subject?: {
        id?: number;
        name?: string | null;
      } | null;
    } | null;
  } | null;
};

type SettingsData = {
  academicYear?: string | null;
  semester?: string | null;
};

type TargetType =
  | 'TP'
  | 'STS'
  | 'SAS';

type ActiveTarget = {
  targetType: TargetType;
  data?: TP;
  title: string;
};

type ScoreType =
  | 'ORAL'
  | 'WRITTEN';

type MessageType =
  | 'success'
  | 'error'
  | '';

/* ============================================================
   HELPERS
============================================================ */

function normalizeArray<T>(
  data: unknown,
  possibleKeys: string[] = []
): T[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data as T[];
  }

  if (
    data &&
    typeof data === 'object'
  ) {
    const objectData =
      data as Record<
        string,
        unknown
      >;

    for (
      const key of possibleKeys
    ) {
      if (
        Array.isArray(
          objectData[key]
        )
      ) {
        return objectData[
          key
        ] as T[];
      }
    }

    if (
      Array.isArray(
        objectData.data
      )
    ) {
      return objectData
        .data as T[];
    }
  }

  return [];
}

async function getApiError(
  response: Response,
  fallback: string
) {
  try {
    const data =
      await response.json();

    return (
      data?.message ||
      data?.error ||
      fallback
    );
  } catch {
    return fallback;
  }
}

function normalizeText(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}

function isInactiveClass(
  status?: string | null
) {
  const normalized =
    normalizeText(
      status
    );

  return (
    normalized ===
      'tidak aktif' ||
    normalized ===
      'nonaktif'
  );
}

function getSemesterNumber(
  semester?: string | null
) {
  return String(
    semester ?? ''
  )
    .trim()
    .toLowerCase() ===
    'genap'
    ? 2
    : 1;
}

function isValidScoreString(
  value: string
) {
  if (
    value === ''
  ) {
    return true;
  }

  const numeric =
    Number(value);

  return (
    Number.isFinite(
      numeric
    ) &&
    numeric >= 0 &&
    numeric <= 100
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function AssessmentPage() {
  /* ==========================================================
     MASTER DATA
  ========================================================== */

  const [
    classes,
    setClasses,
  ] =
    useState<ClassRoom[]>(
      []
    );

  const [
    subjects,
    setSubjects,
  ] =
    useState<Subject[]>(
      []
    );

  const [
    cps,
    setCps,
  ] =
    useState<CP[]>(
      []
    );

  const [
    students,
    setStudents,
  ] =
    useState<Student[]>(
      []
    );

  const [
    assessments,
    setAssessments,
  ] =
    useState<Assessment[]>(
      []
    );

  /* ==========================================================
     SETTINGS
  ========================================================== */

  const [
    academicYear,
    setAcademicYear,
  ] =
    useState('');

  const [
    activeSemester,
    setActiveSemester,
  ] =
    useState(1);

  /* ==========================================================
     FILTER
  ========================================================== */

  const [
    selectedClass,
    setSelectedClass,
  ] =
    useState('');

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] =
    useState('');

  /* ==========================================================
     MODAL
  ========================================================== */

  const [
    activeTarget,
    setActiveTarget,
  ] =
    useState<ActiveTarget | null>(
      null
    );

  const [
    scoresMap,
    setScoresMap,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  /* ==========================================================
     UI
  ========================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingData,
    setLoadingData,
  ] =
    useState(true);

  const [
    message,
    setMessage,
  ] =
    useState('');

  const [
    messageType,
    setMessageType,
  ] =
    useState<MessageType>(
      ''
    );

  /* ==========================================================
     MESSAGE
  ========================================================== */

  const showMessage =
    (
      text: string,
      type: MessageType
    ) => {
      setMessage(
        text
      );

      setMessageType(
        type
      );
    };

  const clearMessage =
    () => {
      setMessage('');
      setMessageType('');
    };

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadData =
    useCallback(
      async () => {
        try {
          setLoadingData(
            true
          );

          clearMessage();

          const [
            classRes,
            subjectRes,
            curriculumRes,
            studentRes,
            assessmentRes,
            settingRes,
          ] =
            await Promise.all([
              fetch(
                '/api/classes',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/subjects?level=${encodeURIComponent(
                  SCHOOL_LEVEL
                )}`,
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/curriculum',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/students',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/assessment',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/settings',
                {
                  cache:
                    'no-store',
                }
              ),
            ]);

          /* ================================================
             CEK RESPONSE
          ================================================ */

          if (
            !classRes.ok
          ) {
            throw new Error(
              await getApiError(
                classRes,
                'Gagal memuat kelas.'
              )
            );
          }

          if (
            !subjectRes.ok
          ) {
            throw new Error(
              await getApiError(
                subjectRes,
                'Gagal memuat mata pelajaran.'
              )
            );
          }

          if (
            !curriculumRes.ok
          ) {
            throw new Error(
              await getApiError(
                curriculumRes,
                'Gagal memuat kurikulum.'
              )
            );
          }

          if (
            !studentRes.ok
          ) {
            throw new Error(
              await getApiError(
                studentRes,
                'Gagal memuat siswa.'
              )
            );
          }

          if (
            !assessmentRes.ok
          ) {
            throw new Error(
              await getApiError(
                assessmentRes,
                'Gagal memuat nilai asesmen.'
              )
            );
          }

          if (
            !settingRes.ok
          ) {
            throw new Error(
              await getApiError(
                settingRes,
                'Gagal memuat pengaturan akademik.'
              )
            );
          }

          /* ================================================
             JSON
          ================================================ */

          const [
            classData,
            subjectData,
            curriculumData,
            studentData,
            assessmentData,
            settingData,
          ] =
            await Promise.all([
              classRes.json(),
              subjectRes.json(),
              curriculumRes.json(),
              studentRes.json(),
              assessmentRes.json(),
              settingRes.json(),
            ]);

          /* ================================================
             CLASSES
          ================================================ */

          const rawClasses =
            normalizeArray<ClassRoom>(
              classData,
              [
                'classes',
                'classRooms',
              ]
            );

          const sdClasses =
            rawClasses
              .filter(
                (
                  item
                ) =>
                  (
                    !item.level ||
                    String(
                      item.level
                    )
                      .trim()
                      .toUpperCase() ===
                      SCHOOL_LEVEL
                  ) &&
                  VALID_GRADES.includes(
                    Number(
                      item.grade
                    )
                  ) &&
                  !isInactiveClass(
                    item.status
                  )
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  Number(
                    a.grade
                  ) -
                    Number(
                      b.grade
                    ) ||
                  a.name.localeCompare(
                    b.name,
                    'id',
                    {
                      numeric:
                        true,
                    }
                  )
              );

          setClasses(
            sdClasses
          );

          /* ================================================
             SUBJECTS
          ================================================ */

          const rawSubjects =
            normalizeArray<Subject>(
              subjectData,
              [
                'subjects',
              ]
            );

          const sdSubjects =
            rawSubjects
              .filter(
                (
                  item
                ) =>
                  !item.level ||
                  String(
                    item.level
                  )
                    .trim()
                    .toUpperCase() ===
                    SCHOOL_LEVEL
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  a.name.localeCompare(
                    b.name,
                    'id'
                  )
              );

          setSubjects(
            sdSubjects
          );

          /* ================================================
             CURRICULUM
          ================================================ */

          const curriculumList =
            normalizeArray<CP>(
              curriculumData,
              [
                'cps',
                'curriculum',
              ]
            );

          setCps(
            curriculumList.filter(
              (
                cp
              ) =>
                VALID_GRADES.includes(
                  Number(
                    cp.grade
                  )
                )
            )
          );

          /* ================================================
             STUDENTS
          ================================================ */

          const studentList =
            normalizeArray<Student>(
              studentData,
              [
                'students',
              ]
            );

          setStudents(
            studentList
          );

          /* ================================================
             ASSESSMENTS
          ================================================ */

          const assessmentList =
            normalizeArray<Assessment>(
              assessmentData,
              [
                'assessments',
              ]
            );

          setAssessments(
            assessmentList
          );

          /* ================================================
             SETTINGS
          ================================================ */

          const settings =
            (
              settingData?.data ||
              settingData ||
              {}
            ) as SettingsData;

          setAcademicYear(
            String(
              settings
                .academicYear ||
                ''
            )
          );

          setActiveSemester(
            getSemesterNumber(
              settings.semester
            )
          );

          /* ================================================
             RESET FILTER JIKA DATA BERUBAH
          ================================================ */

          setSelectedClass(
            (
              current
            ) =>
              sdClasses.some(
                (
                  item
                ) =>
                  item.name ===
                  current
              )
                ? current
                : ''
          );

          setSelectedSubjectId(
            (
              current
            ) =>
              sdSubjects.some(
                (
                  item
                ) =>
                  String(
                    item.id
                  ) ===
                  current
              )
                ? current
                : ''
          );
        } catch (
          error
        ) {
          console.error(
            'LOAD ASSESSMENT PAGE ERROR:',
            error
          );

          showMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat data asesmen.',
            'error'
          );
        } finally {
          setLoadingData(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ==========================================================
     SELECTED CLASS DATA
  ========================================================== */

  const selectedClassData =
    useMemo(
      () =>
        classes.find(
          (
            item
          ) =>
            item.name ===
            selectedClass
        ) ||
        null,
      [
        classes,
        selectedClass,
      ]
    );

  /* ==========================================================
     UNIQUE SUBJECTS
  ========================================================== */

  const uniqueSubjects =
    useMemo(() => {
      const map =
        new Map<
          string,
          Subject
        >();

      for (
        const subject of subjects
      ) {
        const cleanName =
          normalizeText(
            subject.name
          );

        if (
          cleanName &&
          !map.has(
            cleanName
          )
        ) {
          map.set(
            cleanName,
            subject
          );
        }
      }

      return Array.from(
        map.values()
      ).sort(
        (
          a,
          b
        ) =>
          a.name.localeCompare(
            b.name,
            'id'
          )
      );
    }, [
      subjects,
    ]);

  /* ==========================================================
     FILTERED STUDENTS
  ========================================================== */

  const filteredStudents =
    useMemo(() => {
      if (
        !selectedClass
      ) {
        return [];
      }

      return students
        .filter(
          (
            student
          ) =>
            student.class_name ===
            selectedClass
        )
        .sort(
          (
            a,
            b
          ) =>
            a.fullname.localeCompare(
              b.fullname,
              'id'
            )
        );
    }, [
      students,
      selectedClass,
    ]);

  /* ==========================================================
     FILTERED CP
     SUBJECT + GRADE + SEMESTER
  ========================================================== */

  const filteredCPs =
    useMemo(() => {
      if (
        !selectedSubjectId ||
        !selectedClassData
      ) {
        return [];
      }

      const subject =
        subjects.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            selectedSubjectId
        );

      if (!subject) {
        return [];
      }

      const classGrade =
        Number(
          selectedClassData.grade
        );

      if (
        !VALID_GRADES.includes(
          classGrade
        )
      ) {
        return [];
      }

      const targetName =
        normalizeText(
          subject.name
        );

      return cps
        .filter(
          (
            cp
          ) => {
            const matchSubject =
              Number(
                cp.subjectId
              ) ===
                Number(
                  selectedSubjectId
                ) ||
              normalizeText(
                cp.subject?.name
              ) ===
                targetName;

            const matchGrade =
              Number(
                cp.grade
              ) ===
              classGrade;

            const cpSemester =
              cp.semester ===
                null ||
              cp.semester ===
                undefined
                ? 1
                : Number(
                    cp.semester
                  );

            const matchSemester =
              cpSemester ===
              activeSemester;

            return (
              matchSubject &&
              matchGrade &&
              matchSemester
            );
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            a.id -
            b.id
        );
    }, [
      cps,
      subjects,
      selectedSubjectId,
      selectedClassData,
      activeSemester,
    ]);

  /* ==========================================================
     PROGRESS PENILAIAN
  ========================================================== */

  const getGradingPercentage =
    (
      targetType: TargetType,
      tpId?: number
    ) => {
      if (
        filteredStudents.length ===
        0
      ) {
        return 0;
      }

      let gradedCount =
        0;

      for (
        const student of filteredStudents
      ) {
        let hasOral =
          false;

        let hasWritten =
          false;

        if (
          targetType ===
            'TP' &&
          tpId
        ) {
          hasOral =
            assessments.some(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                Number(
                  assessment.tpId
                ) ===
                  tpId &&
                [
                  'ORAL',
                  'TP_ORAL',
                ].includes(
                  String(
                    assessment.type
                  ).toUpperCase()
                )
            );

          hasWritten =
            assessments.some(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                Number(
                  assessment.tpId
                ) ===
                  tpId &&
                [
                  'WRITTEN',
                  'TP_WRITTEN',
                ].includes(
                  String(
                    assessment.type
                  ).toUpperCase()
                )
            );
        } else {
          hasOral =
            assessments.some(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                String(
                  assessment.type
                ).toUpperCase() ===
                  `${targetType}_ORAL`
            );

          hasWritten =
            assessments.some(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                String(
                  assessment.type
                ).toUpperCase() ===
                  `${targetType}_WRITTEN`
            );
        }

        /*
         * Siswa dihitung sudah dinilai
         * jika minimal satu nilai tersedia.
         */
        if (
          hasOral ||
          hasWritten
        ) {
          gradedCount++;
        }
      }

      return Math.round(
        (
          gradedCount /
          filteredStudents.length
        ) *
          100
      );
    };

  /* ==========================================================
     OPEN MODAL
  ========================================================== */

  const openModal =
    (
      targetType: TargetType,
      title: string,
      tpData?: TP
    ) => {
      clearMessage();

      if (
        filteredStudents.length ===
        0
      ) {
        showMessage(
          'Tidak ada siswa pada kelas yang dipilih.',
          'error'
        );

        return;
      }

      setActiveTarget({
        targetType,
        data:
          tpData,
        title,
      });

      const initialMap:
        Record<
          string,
          string
        > = {};

      for (
        const student of filteredStudents
      ) {
        let foundOral:
          Assessment | undefined;

        let foundWritten:
          Assessment | undefined;

        if (
          targetType ===
            'TP' &&
          tpData
        ) {
          foundOral =
            assessments.find(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                Number(
                  assessment.tpId
                ) ===
                  tpData.id &&
                [
                  'ORAL',
                  'TP_ORAL',
                ].includes(
                  String(
                    assessment.type
                  ).toUpperCase()
                )
            );

          foundWritten =
            assessments.find(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                Number(
                  assessment.tpId
                ) ===
                  tpData.id &&
                [
                  'WRITTEN',
                  'TP_WRITTEN',
                ].includes(
                  String(
                    assessment.type
                  ).toUpperCase()
                )
            );
        } else {
          foundOral =
            assessments.find(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                String(
                  assessment.type
                ).toUpperCase() ===
                  `${targetType}_ORAL`
            );

          foundWritten =
            assessments.find(
              (
                assessment
              ) =>
                assessment.studentId ===
                  student.id &&
                String(
                  assessment.type
                ).toUpperCase() ===
                  `${targetType}_WRITTEN`
            );
        }

        if (
          foundOral
        ) {
          initialMap[
            `${student.id}-ORAL`
          ] =
            String(
              foundOral.score
            );
        }

        if (
          foundWritten
        ) {
          initialMap[
            `${student.id}-WRITTEN`
          ] =
            String(
              foundWritten.score
            );
        }
      }

      setScoresMap(
        initialMap
      );
    };

  /* ==========================================================
     SCORE CHANGE
  ========================================================== */

  const handleScoreChange =
    (
      studentId: number,
      type: ScoreType,
      value: string
    ) => {
      if (
        !isValidScoreString(
          value
        )
      ) {
        return;
      }

      setScoresMap(
        (
          previous
        ) => ({
          ...previous,

          [`${studentId}-${type}`]:
            value,
        })
      );
    };

  /* ==========================================================
     SAVE ALL SCORES
  ========================================================== */

  const handleSaveAllScores =
    async () => {
      if (
        !activeTarget
      ) {
        return;
      }

      if (
        !selectedClassData
      ) {
        showMessage(
          'Kelas yang dipilih tidak valid.',
          'error'
        );

        return;
      }

      if (
        !selectedSubjectId
      ) {
        showMessage(
          'Mata pelajaran belum dipilih.',
          'error'
        );

        return;
      }

      if (
        activeTarget.targetType ===
          'TP' &&
        !activeTarget.data
      ) {
        showMessage(
          'Tujuan Pembelajaran tidak valid.',
          'error'
        );

        return;
      }

      /* ------------------------------------------------------
         SUSUN REQUEST
      ------------------------------------------------------ */

      const requests:
        Array<{
          studentName: string;
          scoreType: string;
          payload: {
            studentId: number;
            tpId?: number;
            score: number;
            type: string;
          };
        }> = [];

      for (
        const student of filteredStudents
      ) {
        const oralValue =
          scoresMap[
            `${student.id}-ORAL`
          ];

        const writtenValue =
          scoresMap[
            `${student.id}-WRITTEN`
          ];

        /* ORAL */

        if (
          oralValue !==
            undefined &&
          oralValue !== ''
        ) {
          const score =
            Number(
              oralValue
            );

          if (
            !Number.isFinite(
              score
            ) ||
            score < 0 ||
            score > 100
          ) {
            showMessage(
              `Nilai lisan ${student.fullname} tidak valid.`,
              'error'
            );

            return;
          }

          requests.push({
            studentName:
              student.fullname,

            scoreType:
              'Lisan / Praktik',

            payload: {
              studentId:
                student.id,

              score,

              type:
                activeTarget.targetType ===
                'TP'
                  ? 'ORAL'
                  : `${activeTarget.targetType}_ORAL`,

              ...(activeTarget.targetType ===
                'TP' &&
              activeTarget.data
                ? {
                    tpId:
                      activeTarget.data
                        .id,
                  }
                : {}),
            },
          });
        }

        /* WRITTEN */

        if (
          writtenValue !==
            undefined &&
          writtenValue !== ''
        ) {
          const score =
            Number(
              writtenValue
            );

          if (
            !Number.isFinite(
              score
            ) ||
            score < 0 ||
            score > 100
          ) {
            showMessage(
              `Nilai tertulis ${student.fullname} tidak valid.`,
              'error'
            );

            return;
          }

          requests.push({
            studentName:
              student.fullname,

            scoreType:
              'Tertulis',

            payload: {
              studentId:
                student.id,

              score,

              type:
                activeTarget.targetType ===
                'TP'
                  ? 'WRITTEN'
                  : `${activeTarget.targetType}_WRITTEN`,

              ...(activeTarget.targetType ===
                'TP' &&
              activeTarget.data
                ? {
                    tpId:
                      activeTarget.data
                        .id,
                  }
                : {}),
            },
          });
        }
      }

      if (
        requests.length ===
        0
      ) {
        showMessage(
          'Belum ada nilai yang diisi.',
          'error'
        );

        return;
      }

      /* ------------------------------------------------------
         SAVE
      ------------------------------------------------------ */

      setLoading(
        true
      );

      clearMessage();

      try {
        /*
         * Request dijalankan paralel,
         * tetapi setiap response tetap diperiksa.
         */
        const results =
          await Promise.all(
            requests.map(
              async (
                requestItem
              ) => {
                const response =
                  await fetch(
                    '/api/assessment',
                    {
                      method:
                        'POST',

                      headers: {
                        'Content-Type':
                          'application/json',
                      },

                      body:
                        JSON.stringify(
                          requestItem.payload
                        ),
                    }
                  );

                if (
                  !response.ok
                ) {
                  const errorMessage =
                    await getApiError(
                      response,
                      'Gagal menyimpan nilai.'
                    );

                  throw new Error(
                    `${requestItem.studentName} (${requestItem.scoreType}): ${errorMessage}`
                  );
                }

                return response;
              }
            )
          );

        showMessage(
          `${results.length} nilai asesmen berhasil disimpan.`,
          'success'
        );

        await loadData();

        /*
         * Jangan langsung tutup modal sebelum
         * pengguna sempat melihat hasil.
         */
        window.setTimeout(
          () => {
            setActiveTarget(
              null
            );

            setScoresMap(
              {}
            );
          },
          800
        );
      } catch (
        error
      ) {
        console.error(
          'SAVE ASSESSMENT ERROR:',
          error
        );

        showMessage(
          error instanceof
            Error
            ? error.message
            : 'Gagal menyimpan nilai asesmen.',
          'error'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     SELECTED SUBJECT
  ========================================================== */

  const selectedSubject =
    useMemo(
      () =>
        subjects.find(
          (
            subject
          ) =>
            String(
              subject.id
            ) ===
            selectedSubjectId
        ) ||
        null,
      [
        subjects,
        selectedSubjectId,
      ]
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f5f8f6]">

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-[#064e3b] px-6 py-7 text-white shadow-lg">

          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/[0.06] blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">

                <ClipboardCheck
                  size={23}
                  className="text-emerald-200"
                />

              </div>

              <div>

                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200/60">
                  Akademik • Asesmen
                </span>

                <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                  Input Nilai Asesmen
                </h1>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-emerald-100/65">
                  Pilih kelas dan mata pelajaran, kemudian isi nilai lisan/praktik dan tertulis siswa.
                </p>

              </div>

            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">

              <button
                type="button"
                onClick={
                  loadData
                }
                disabled={
                  loadingData ||
                  loading
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold transition hover:bg-white/20 disabled:opacity-50"
              >

                <RefreshCw
                  size={14}
                  className={
                    loadingData
                      ? 'animate-spin'
                      : ''
                  }
                />

                Perbarui

              </button>

              <div className="text-[9px] text-emerald-100/50">
                {academicYear ||
                  'Tahun ajaran belum diatur'}{' '}
                • Semester{' '}
                {activeSemester}
              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-xs font-semibold ${
              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >

            {messageType ===
            'success' ? (
              <CheckCircle2
                size={17}
                className="shrink-0"
              />
            ) : (
              <AlertCircle
                size={17}
                className="shrink-0"
              />
            )}

            {message}

          </div>
        )}

        {/* ====================================================
            FILTER
        ===================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

              <GraduationCap
                size={18}
              />

            </div>

            <div>

              <h2 className="text-sm font-bold text-slate-800">
                Parameter Asesmen
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Jenjang SD • Kelas 1–6
              </p>

            </div>

          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">

              <Loader2
                size={20}
                className="animate-spin text-emerald-600"
              />

              <span className="ml-2 text-xs text-slate-400">
                Memuat data...
              </span>

            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">

              {/* CLASS */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  1. Pilih Kelas *
                </label>

                <select
                  value={
                    selectedClass
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedClass(
                      event.target
                        .value
                    );

                    setActiveTarget(
                      null
                    );

                    setScoresMap(
                      {}
                    );

                    clearMessage();
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >

                  <option value="">
                    -- Pilih Kelas --
                  </option>

                  {classes.map(
                    (
                      classRoom
                    ) => (
                      <option
                        key={
                          classRoom.id
                        }
                        value={
                          classRoom.name
                        }
                      >
                        Kelas{' '}
                        {
                          classRoom.name
                        }{' '}
                        • Tingkat{' '}
                        {
                          classRoom.grade
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* SUBJECT */}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  2. Pilih Mata Pelajaran *
                </label>

                <select
                  value={
                    selectedSubjectId
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedSubjectId(
                      event.target
                        .value
                    );

                    setActiveTarget(
                      null
                    );

                    setScoresMap(
                      {}
                    );

                    clearMessage();
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >

                  <option value="">
                    -- Pilih Mata Pelajaran --
                  </option>

                  {uniqueSubjects.map(
                    (
                      subject
                    ) => (
                      <option
                        key={
                          subject.id
                        }
                        value={
                          subject.id
                        }
                      >
                        {
                          subject.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>
          )}

        </section>

        {/* ====================================================
            MAIN CONTENT
        ===================================================== */}

        {selectedClass &&
        selectedSubjectId &&
        selectedClassData &&
        selectedSubject ? (
          <div className="space-y-6">

            {/* SELECTED INFO */}

            <section className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2 text-xs">

                <School
                  size={14}
                  className="text-emerald-700"
                />

                <span className="font-semibold text-emerald-900">
                  Kelas{' '}
                  {
                    selectedClass
                  }
                </span>

                <span className="text-emerald-400">
                  •
                </span>

                <span className="font-semibold text-emerald-900">
                  {
                    selectedSubject.name
                  }
                </span>

              </div>

              <div className="text-[10px] text-emerald-700/60">
                {
                  filteredStudents.length
                }{' '}
                siswa • Semester{' '}
                {
                  activeSemester
                }
              </div>

            </section>

            {/* ================================================
                STS & SAS
            ================================================= */}

            <div className="grid gap-4 sm:grid-cols-2">

              <AssessmentSpecialCard
                title="Sumatif Tengah Semester (STS)"
                subtitle="Asesmen tengah semester"
                progress={
                  getGradingPercentage(
                    'STS'
                  )
                }
                variant="blue"
                onClick={() =>
                  openModal(
                    'STS',
                    'Sumatif Tengah Semester (STS)'
                  )
                }
              />

              <AssessmentSpecialCard
                title="Sumatif Akhir Semester (SAS)"
                subtitle="Asesmen akhir semester"
                progress={
                  getGradingPercentage(
                    'SAS'
                  )
                }
                variant="purple"
                onClick={() =>
                  openModal(
                    'SAS',
                    'Sumatif Akhir Semester (SAS)'
                  )
                }
              />

            </div>

            {/* =================================================
                CP & TP
            ================================================== */}

            <section className="space-y-4">

              <div>

                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Capaian &amp; Tujuan Pembelajaran
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  {
                    selectedSubject.name
                  }{' '}
                  • Kelas{' '}
                  {
                    selectedClassData.grade
                  }{' '}
                  • Semester{' '}
                  {
                    activeSemester
                  }
                </p>

              </div>

              {filteredCPs.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">

                  <BookOpen
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Belum ada struktur kurikulum
                  </p>

                  <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-400">
                    Belum ditemukan CP untuk {selectedSubject.name}, Kelas {selectedClassData.grade}, Semester {activeSemester}.
                  </p>

                </div>
              ) : (
                filteredCPs.map(
                  (
                    cp,
                    cpIndex
                  ) => {
                    const tpList =
                      Array.isArray(
                        cp.tps
                      )
                        ? cp.tps
                        : [];

                    return (
                      <article
                        key={
                          cp.id
                        }
                        className="space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                              CP{' '}
                              {
                                cpIndex +
                                1
                              }
                            </span>

                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              Kelas{' '}
                              {
                                cp.grade
                              }
                            </span>

                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                              Semester{' '}
                              {cp.semester ||
                                1}
                            </span>

                          </div>

                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                            {
                              cp.description
                            }
                          </p>

                        </div>

                        <div className="space-y-3 border-l-2 border-amber-400 pl-4">

                          {tpList.length ===
                          0 ? (
                            <div className="text-xs italic text-slate-400">
                              Belum ada Tujuan Pembelajaran untuk CP ini.
                            </div>
                          ) : (
                            tpList.map(
                              (
                                tp,
                                tpIndex
                              ) => {
                                const percentage =
                                  getGradingPercentage(
                                    'TP',
                                    tp.id
                                  );

                                return (
                                  <div
                                    key={
                                      tp.id
                                    }
                                    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
                                  >

                                    <div className="flex-1 space-y-1">

                                      <div className="flex flex-wrap items-center gap-2">

                                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                          TP{' '}
                                          {
                                            tpIndex +
                                            1
                                          }
                                        </span>

                                        <ProgressBadge
                                          value={
                                            percentage
                                          }
                                        />

                                      </div>

                                      <p className="text-xs font-medium leading-5 text-slate-700">
                                        {
                                          tp.description
                                        }
                                      </p>

                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openModal(
                                          'TP',
                                          `CP ${cpIndex + 1} — TP ${tpIndex + 1}: ${tp.description}`,
                                          tp
                                        )
                                      }
                                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                                        percentage ===
                                        100
                                          ? 'bg-emerald-700 hover:bg-emerald-800'
                                          : 'bg-[#064e3b] hover:bg-[#053d2e]'
                                      }`}
                                    >
                                      Input Nilai
                                    </button>

                                  </div>
                                );
                              }
                            )
                          )}

                        </div>

                      </article>
                    );
                  }
                )
              )}

            </section>

          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">

            <GraduationCap
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              Pilih kelas dan mata pelajaran
            </p>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
              Pilih kelas dan mata pelajaran di atas untuk menampilkan lembar asesmen siswa.
            </p>

          </section>
        )}

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[9px] text-slate-400 sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_NAME}
          </span>

          <span>
            Input Asesmen • Jenjang SD
          </span>

        </footer>

      </div>

      {/* ======================================================
          MODAL
      ======================================================= */}

      {activeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">

          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between gap-4 bg-[#064e3b] px-5 py-4 text-white">

              <div>

                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-200">
                  Input Nilai • Kelas{' '}
                  {
                    selectedClass
                  }
                </span>

                <h3 className="mt-1 text-xs font-bold leading-5">
                  {
                    activeTarget.title
                  }
                </h3>

              </div>

              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() => {
                  setActiveTarget(
                    null
                  );

                  setScoresMap(
                    {}
                  );
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
              >

                <X
                  size={16}
                />

              </button>

            </div>

            {/* BODY */}

            <div className="flex-1 overflow-auto p-4 sm:p-6">

              {filteredStudents.length ===
              0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Tidak ada siswa di kelas ini.
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[650px] border-collapse text-left text-xs">

                    <thead>

                      <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">

                        <th className="w-12 p-3 text-center">
                          No
                        </th>

                        <th className="p-3">
                          Nama Siswa
                        </th>

                        <th className="w-40 p-3 text-center text-emerald-800">
                          Lisan / Praktik
                        </th>

                        <th className="w-40 p-3 text-center text-blue-800">
                          Tertulis
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredStudents.map(
                        (
                          student,
                          index
                        ) => (
                          <tr
                            key={
                              student.id
                            }
                            className="hover:bg-slate-50/50"
                          >

                            <td className="p-3 text-center text-slate-400">
                              {
                                index +
                                1
                              }
                            </td>

                            <td className="p-3">

                              <div className="font-semibold text-slate-800">
                                {
                                  student.fullname
                                }
                              </div>

                              {student.nisn && (
                                <div className="mt-0.5 text-[9px] text-slate-400">
                                  NISN{' '}
                                  {
                                    student.nisn
                                  }
                                </div>
                              )}

                            </td>

                            <td className="p-3 text-center">

                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="1"
                                value={
                                  scoresMap[
                                    `${student.id}-ORAL`
                                  ] ??
                                  ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleScoreChange(
                                    student.id,
                                    'ORAL',
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="0-100"
                                className="h-10 w-28 rounded-xl border border-slate-200 bg-white text-center text-xs font-bold text-slate-900 shadow-inner outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                              />

                            </td>

                            <td className="p-3 text-center">

                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="1"
                                value={
                                  scoresMap[
                                    `${student.id}-WRITTEN`
                                  ] ??
                                  ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleScoreChange(
                                    student.id,
                                    'WRITTEN',
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="0-100"
                                className="h-10 w-28 rounded-xl border border-slate-200 bg-white text-center text-xs font-bold text-slate-900 shadow-inner outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                              />

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-[10px] text-slate-400">
                Nilai yang diizinkan: 0–100
              </p>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() => {
                    setActiveTarget(
                      null
                    );

                    setScoresMap(
                      {}
                    );
                  }}
                  className="rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveAllScores
                  }
                  disabled={
                    loading ||
                    filteredStudents.length ===
                      0
                  }
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-[#064e3b] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#053d2e] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />

                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save
                        size={14}
                      />

                      Simpan Nilai
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

/* ============================================================
   PROGRESS BADGE
============================================================ */

function ProgressBadge({
  value,
}: {
  value: number;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        value === 100
          ? 'bg-emerald-100 text-emerald-800'
          : value > 0
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-200 text-slate-600'
      }`}
    >
      {value}% Dinilai
    </span>
  );
}

/* ============================================================
   SPECIAL ASSESSMENT CARD
============================================================ */

function AssessmentSpecialCard({
  title,
  subtitle,
  progress,
  variant,
  onClick,
}: {
  title: string;
  subtitle: string;
  progress: number;
  variant:
    | 'blue'
    | 'purple';
  onClick: () => void;
}) {
  const buttonClass =
    progress === 100
      ? 'bg-emerald-700 hover:bg-emerald-800'
      : variant ===
          'blue'
        ? 'bg-blue-700 hover:bg-blue-800'
        : 'bg-purple-700 hover:bg-purple-800';

  const badgeClass =
    variant ===
    'blue'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800';

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">

      <div>

        <div className="flex flex-wrap items-center gap-2">

          <span
            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${badgeClass}`}
          >
            {subtitle}
          </span>

          <ProgressBadge
            value={
              progress
            }
          />

        </div>

        <h3 className="mt-2 text-sm font-bold text-slate-800">
          {title}
        </h3>

      </div>

      <button
        type="button"
        onClick={
          onClick
        }
        className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition ${buttonClass}`}
      >
        Input Nilai
      </button>

    </div>
  );
}