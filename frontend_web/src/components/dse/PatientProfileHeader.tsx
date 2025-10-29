'use client';

interface PatientData {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  avatar: string;
  allergies: string[];
  chronic: string[];
  lastVisit: string;
  weight: string;
  tension: string;
  role: string;
}

const PatientProfileHeader = ({ patient }: { patient: PatientData }) => {
  return (
    <div className="p-4 bg-blanc-pur rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-nuit-confiance">Profil de {patient.name}</h2>
    </div>
  );
};

export default PatientProfileHeader;
