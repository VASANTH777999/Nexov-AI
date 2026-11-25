import { resetAppointmentsStore } from './_lib/serverStore';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  resetAppointmentsStore();
  return res.status(200).json({
    status: 'success',
    message: 'Database successfully reset and re-seeded with pristine mock data.',
  });
}
