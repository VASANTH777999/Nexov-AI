import { executeServerTool } from '../_lib/serverTools';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { patient_phone, doctor_name_or_id, date, time_slot, patient_name } = req.body || {};
  const result = executeServerTool('book_appointment', {
    patient_phone,
    doctor_name_or_id,
    date,
    time_slot,
    patient_name,
  });

  if (result.status === 'error') {
    return res.status(400).json(result);
  }
  return res.status(200).json(result);
}
