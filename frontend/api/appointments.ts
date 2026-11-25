import { getAppointmentsStore } from './_lib/serverStore';
import { normalizePhone } from './_lib/serverTools';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const phone = (req.query?.phone as string) || '';
  const appointments = getAppointmentsStore();

  if (phone) {
    const clean = normalizePhone(phone);
    const filtered = appointments.filter(
      (a) =>
        normalizePhone(a.patient_phone).includes(clean) ||
        clean.includes(normalizePhone(a.patient_phone))
    );
    return res.status(200).json({
      status: 'success',
      count: filtered.length,
      appointments: filtered,
    });
  }

  return res.status(200).json({
    status: 'success',
    count: appointments.length,
    appointments,
  });
}
