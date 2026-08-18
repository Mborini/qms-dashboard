// data/routeNotes.js

// ========================================
// Districts
// ========================================

export const districts = [
  {
    value: "الجبيهة",
    label: "الجبيهة",
  },
  {
    value: "طارق",
    label: "طارق",
  },
  {
    value: "أبو نصير",
    label: "أبو نصير",
  },
  {
    value: "شفا بدران",
    label: "شفا بدران",
  },
];

// ========================================
// Blocks
// ========================================

export const blocks = {
  الجبيهة: [
    {
      value: "1",
      label: "الريان",
    },
    {
      value: "2",
      label: "البلدية",
    },
    {
      value: "3",
      label: "ام زويتينة",
    },
    {
      value: "4",
      label: "الصديق",
    },
    {
      value: "5",
      label: "المنصور",
    },
    {
      value: "6",
      label: "الرشيد",
    },
    {
      value: "7",
      label: "ابن عوف",
    },
    {
      value: "8",
      label: "قطنة",
    },
    {
      value: "9",
      label: "المدينة",
    },
    {
      value: "10",
      label: "الجامعة",
    },
  ],

  طارق: [
    {
      value: "1",
      label: "الخزنة",
    },
    {
      value: "2",
      label: "وسط البلد",
    },
    {
      value: "3",
      label: "القرطوعية",
    },
    {
      value: "4",
      label: "المدورة",
    },
    {
      value: "5",
      label: "ابوعليا يمين",
    },
    {
      value: "6",
      label: "ابوعليا شمال",
    },
    {
      value: "7",
      label: "عين رباط",
    },
    {
      value: "8",
      label: "عين غزال",
    },
    {
      value: "9",
      label: "الفيصل",
    },
  ],

  "أبو نصير": [
    {
      value: "1",
      label: "الأمانة",
    },
    {
      value: "2",
      label: "البسالة",
    },
    {
      value: "3",
      label: "المحبة",
    },
    {
      value: "4",
      label: "الفاروق",
    },
    {
      value: "5",
      label: "الضياء",
    },
    {
      value: "6",
      label: "السعادة",
    },
  ],

  "شفا بدران": [
    {
      value: "1",
      label: "قطعة 1",
    },
    {
      value: "2",
      label: "قطعة 2",
    },
  ],
};

// ========================================
// Vehicles
// كل مركبة مرتبطة بمنطقة
// ========================================

export const vehicles = {
  الجبيهة: [
    {
      value: "60-12345",
      label: "60-12345 - ضاغطة نفايات",
    },
    {
      value: "60-67890",
      label: "60-67890 - ضاغطة نفايات",
    },
  ],

  طارق: [
    {
      value: "60-11223",
      label: "60-11223 - ضاغطة نفايات",
    },
    {
      value: "60-44556",
      label: "60-44556 - ضاغطة نفايات",
    },
  ],

  "أبو نصير": [
    {
      value: "60-77889",
      label: "60-77889 - ضاغطة نفايات",
    },
    {
      value: "60-99112",
      label: "60-99112 - ضاغطة نفايات",
    },
  ],

  "شفا بدران": [
    {
      value: "60-22334",
      label: "60-22334 - ضاغطة نفايات",
    },
    {
      value: "60-55667",
      label: "60-55667 - ضاغطة نفايات",
    },
  ],
};

// ========================================
// Streets
// ========================================

export const streets = [
  {
    value: "شارع الجامعة",
    label: "شارع الجامعة",
  },
  {
    value: "شارع الأردن",
    label: "شارع الأردن",
  },
  {
    value: "شارع وصفي التل",
    label: "شارع وصفي التل",
  },
  {
    value: "شارع مكة",
    label: "شارع مكة",
  },
];

// ========================================
// Note Types
// ========================================

export const noteTypes = [
  {
    value: "NO_COLLECTION",
    label: "عدم جمع",
    color: "red",
    requiresStreet: true,
    requiresContainers: true,
  },
  {
    value: "PASSED_WITHOUT_COLLECTION",
    label: "مرور دون جمع",
    color: "orange",
    requiresStreet: true,
    requiresContainers: true,
  },
  {
    value: "NO_DISTRICT_ENTRY",
    label: "عدم دخول للحي",
    color: "blue",
    requiresStreet: false,
    requiresContainers: false,
  },
];

// ========================================
// Helpers
// ========================================

export const getBlocksByDistrict = (district) => {
  if (!district) {
    return [];
  }

  return blocks[district] || [];
};

export const getVehiclesByDistrict = (district) => {
  if (!district) {
    return [];
  }

  return vehicles[district] || [];
};

export const getNoteType = (value) => {
  return noteTypes.find(
    (item) => item.value === value
  );
};