import { executeServerTool } from './_lib/serverTools';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const doctor = (req.query?.doctor as string) || '';
  const date = (req.query?.date as string) || 'tomorrow';

  const result = executeServerTool('check_doctor_availability', {
    doctor_name_or_specialty: doctor,
    date,
  });

  return res.status(200).json(result);
}
