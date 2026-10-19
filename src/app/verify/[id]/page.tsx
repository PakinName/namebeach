import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import PrintCertificate from '@/components/ui/PrintCertificate';
import './certificate.css';

export default async function VerifyCertificate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const certificate = await prisma.certificate.findUnique({ where: { verificationId: id }, select: { student:{select:{fullName:true}},studentName: true, courseTitle: true, issuedAt: true, revokedAt: true, verificationId: true } });
  if (!certificate) notFound();
  if(!certificate.student.fullName)return <main className="card card-body"><h1>กรุณากรอกชื่อจริงในหน้าโปรไฟล์ก่อนแสดงเกียรติบัตร / Complete your legal name in your profile</h1></main>;
  return <main className="certificate-page">
    <article className="certificate-sheet" aria-label="เกียรติบัตรสำเร็จการเรียน">
      <div className="certificate-corner corner-top" aria-hidden="true" />
      <div className="certificate-corner corner-bottom" aria-hidden="true" />
      <header className="certificate-brand"><span className="certificate-brand-icon" aria-hidden="true">✦</span><span>NovaX<small>LEARNING · GROWTH · ACHIEVEMENT</small></span></header>
      <div className="certificate-heading"><p className="certificate-eyebrow">CERTIFICATE OF COMPLETION</p><h1>เกียรติบัตรสำเร็จการเรียน</h1><div className="certificate-divider" aria-hidden="true"><span>✦</span></div></div>
      <p className="certificate-intro">เกียรติบัตรฉบับนี้มอบให้แก่<span>This certificate is proudly presented to</span></p>
      <h2 className="certificate-recipient">{certificate.student.fullName}</h2>
      <p className="certificate-description">เพื่อรับรองว่าได้สำเร็จการศึกษาตามเกณฑ์ของรายวิชา<span>For successfully fulfilling the requirements of the course</span></p>
      <h2 className="certificate-course">{certificate.courseTitle}</h2>
      <footer className="certificate-footer">
        <div className="certificate-date"><strong>{new Date(certificate.issuedAt).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' })}</strong><span>วันที่ออกเกียรติบัตร · DATE OF ISSUE</span></div>
        <div className="certificate-seal" aria-hidden="true"><span>NovaX</span><strong>✦</strong><span>COMPLETION</span></div>
        <div className="certificate-authority"><strong>NovaX</strong><span>ระบบรับรองผลการเรียนรู้<br />LEARNING ACHIEVEMENT</span></div>
      </footer>
      <div className="certificate-verification"><span className={certificate.revokedAt ? 'certificate-revoked' : 'certificate-valid'}>{certificate.revokedAt ? 'เพิกถอนแล้ว / REVOKED' : 'ตรวจสอบแล้ว / VERIFIED'}</span><small>Verification ID · {certificate.verificationId}</small><small>/verify/{certificate.verificationId}</small></div>
    </article>
    <div className="no-print certificate-actions">{!certificate.revokedAt && <PrintCertificate />}<p>สำหรับ PDF แนะนำกระดาษ A4 แนวนอน และปิดหัวกระดาษ/ท้ายกระดาษของเบราว์เซอร์</p></div>
  </main>;
}
