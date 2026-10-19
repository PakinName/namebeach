import prisma from './prisma';
import { studentCourseFilter } from './course-access';
import { canAccessChapter, canTakeQuiz } from './progression';

export async function studentOverview(studentId: string) {
  const courses = await prisma.course.findMany({ where: studentCourseFilter(studentId), orderBy: { title:'asc' }, include: { chapters: { orderBy: { orderIndex:'asc' }, include: { lessons: { orderBy: { orderIndex:'asc' }, select: { id:true,title:true,lessonCompletions: { where: { studentId }, select: { completedAt:true } } } }, quiz: { include: { attempts: { where: { studentId }, orderBy: { startedAt:'desc' }, select: { percentage:true,passed:true,startedAt:true,status:true } } } } } } } });
  return Promise.all(courses.map(async course => {
    const lessons = course.chapters.flatMap(chapter=>chapter.lessons);
    const done = lessons.filter(lesson=>lesson.lessonCompletions.length>0).length;
    const quizzes = await Promise.all(course.chapters.filter(chapter=>chapter.quiz).map(async chapter=>{const quiz=chapter.quiz!;const graded=quiz.attempts.filter(a=>a.status==='GRADED');return {id:quiz.id,title:quiz.title,passingScore:quiz.passingScore,highestScore:graded.length?Math.max(...graded.map(a=>a.percentage)):null,passed:graded.some(a=>a.passed),pending:quiz.attempts.some(a=>a.status==='PENDING'),ready:await canTakeQuiz(studentId,chapter.id)};}));
    const completedChapters = course.chapters.filter(c => c.lessons.length>0 && c.lessons.every(l=>l.lessonCompletions.length>0) && !!c.quiz?.attempts.some(a=>a.passed&&a.status==='GRADED')).length;
    const completed = course.chapters.length>0 && completedChapters===course.chapters.length;
    let nextLesson: {id:string;title:string}|null = null;
    for (const chapter of course.chapters) {
      const candidate=chapter.lessons.find(lesson=>!lesson.lessonCompletions.length);
      if(candidate && await canAccessChapter(studentId,course.id,chapter.id)){ nextLesson={id:candidate.id,title:candidate.title};break; }
    }
    return { courseId:course.id,title:course.title,totalLessons:lessons.length,completedLessons:done,progressPercent:course.chapters.length?Math.floor(completedChapters/course.chapters.length*100):0,status:completed?'COMPLETED':done||quizzes.some(q=>q.highestScore!==null)?'IN_PROGRESS':'NOT_STARTED',quizzes,nextLesson };
  }));
}

export async function issueEligibleCertificates(studentId: string) {
  // Serializable snapshot means lessons, passing criteria and issue record agree.
  await prisma.$transaction(async tx => {
    const student=await tx.user.findUnique({where:{id:studentId}});
    if(!student?.active||student.role!=='STUDENT'||!student.fullName?.trim())return;
    const courses=await tx.course.findMany({where:studentCourseFilter(studentId),include:{chapters:{include:{lessons:{select:{id:true,lessonCompletions:{where:{studentId},select:{id:true}}}},quiz:{include:{attempts:{where:{studentId,status:'GRADED'},select:{percentage:true,passed:true}}}}}}}});
    for(const course of courses){
      const lessons=course.chapters.flatMap(c=>c.lessons);
      if(!course.chapters.length||course.chapters.some(c=>!c.quiz?.attempts.some(a=>a.passed)||!c.lessons.length||c.lessons.some(l=>!l.lessonCompletions.length)))continue;
      await tx.certificate.upsert({where:{studentId_courseId:{studentId,courseId:course.id}},update:{studentName:student.fullName},create:{studentId,courseId:course.id,studentName:student.fullName,courseTitle:course.title,criteria:{policy:'sequential-lessons-and-graded-checkpoints-v2',lessons:lessons.map(l=>l.id),quizzes:course.chapters.flatMap(c=>c.quiz?[{id:c.quiz.id,passingScore:c.quiz.passingScore}]:[])}}});
    }
  },{isolationLevel:'Serializable'});
}
