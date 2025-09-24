export interface IssueParentBirthCertificateRequest {
  parentOobiUrl: string;
  birthCertificateData: BirthCertificateData;
}

export interface BirthCertificateData {
  registrationNumber: string;
  childInformation: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    sex: string;
  };
  placeOfBirth: {
    facilityHospitalName: string;
    city: string;
    county: string;
    state: string;
  };
  motherParentInformation: {
    firstName: string;
    maidenName: string;
  };
  certifierInformation: {
    certifierName: string;
    title: string;
    dateSigned: string;
  };
}
