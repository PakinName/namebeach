import prisma from './prisma';
export const studentCourseFilter=(studentId:string)=>({published:true,OR:[{joinCodeHash:null},{enrollments:{some:{studentId}}}]});
export async function canEnterCourse(studentId:string,courseId:string){return !!await prisma.course.findFirst({where:{id:courseId,...studentCourseFilter(studentId)},select:{id:true}});}
