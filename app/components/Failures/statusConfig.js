import {
  IconCircleCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";

export const summaryOnlyStatuses = [
  "ResolutionRejected",
  "PendingSpValidation",
];

export const DistrictConfig ={
 
  "منطقة طارق": {
    main: "#E8590C", // برتقالي
    light: "#FFF4E6",
  },

  "منطقة الجبيهة": {
    main: "#2F9E44", // أخضر
    light: "#EBF7EE",
  },

  "منطقة ابو نصير": {
    main: "#C92A2A", // أحمر
    light: "#FFF0F0",
  },

  "منطقة شفا بدران": {
    main: "#FCC419", // أصفر
    light: "#FFF9DB",
  },

  "منطقة احد": {
    main: "#7950F2", // بنفسجي
    light: "#F3F0FF",
  },

  "منطقة ماركا": {
    main: "#F06595", // وردي
    light: "#FFF0F6",
  },

  "منطقة النصر": {
    main: "#20C997", // تركوازي
    light: "#E6FCF5",
  },

  "منطقة تلاع العلي وام السماق وخلدا": {
    main: "#795548", // بني
    light: "#EFEBE9",
  },

  "مخالفات حسب مؤشرات الأداء": {
    main: "#15AABF", // سماوي
    light: "#E3FAFC",
  },

}
export const statusConfig = {
 PendingSpValidation:{
    label:"بانتظار القبول",
    color:"gray",
    bg:"#f1f3f5",
    icon:<IconClock size={18}/>
  },
  InProgress:{
    label:"قيد التنفيذ",
    color:"orange",
    bg:"#fff4e0",
    icon:<IconClock size={18}/>
  },
  PendingFieldMonitorVerification:{
    label:"في انتظار التحقق الميداني",
    color:"cyan",
    bg:"#e7f5ff",
    icon:<IconClock size={18}/>
  },

  Resolved:{
    label:"تم الحل",
    color:"green",
    bg:"#e9f8ee",
    icon:<IconCircleCheck size={18}/>
  },


 
  PendingSupervisorReview:{
    label:"قيد مراجعة AVTR",
    color:"violet",
    bg:"#f3f0ff",
    icon:<IconClock size={18}/>
  },
 
  Rejected:{
    label:"AVTR قبلت الرفض",
    color:"red",
    bg:"#ffeaea",
    icon:<IconClock size={18}/>
  },
 ResolutionRejected:{
    label:"AVTR رفضت الحل",
    color:"red",
    bg:"#ffeaea",
    icon:<IconX size={18}/>
  },






  

};