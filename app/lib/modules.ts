// app/lib/modules.ts
// مصدر واحد للصلاحيات والكروت والأقسام.
// بدون imports من React عشان يشتغل بالـ middleware.

export type SectionKey = "operations" | "maintenance" | "admin";

export type ModuleDef = {
  /** اسم الصلاحية اللازمة لرؤية الكرت وفتح الصفحة */
  key: string;
  section: SectionKey;
  href: string;
  title: string;
  description: string;
  footer: string;
  /** اسم الأيقونة (بتتحول لأيقونة فعلية بالصفحة) */
  icon: string;
  color: string;
};

export type SectionDef = {
  key: SectionKey;
  title: string;
  description: string;
  icon: string;
  dir: "rtl" | "ltr";
  cols: { base: number; sm: number; lg: number };
  collapsible?: boolean;
};

export const SECTIONS: SectionDef[] = [
  {
    key: "operations",
    title: "العمليات",
    description:
      "إدارة العمليات، الملاحظات، المخالفات, الخرائط، المناطق وادارة الحاويات.",
    icon: "IconMap2",
    dir: "rtl",
    cols: { base: 1, sm: 2, lg: 3 },
  },
  {
    key: "maintenance",
    title: "الصيانة",
    description:
      "ادخال و اخراج المركبات من والى الصيانة، إدارة أنواع الصيانة والمركبات.",
    icon: "IconTool",
    dir: "rtl",
    cols: { base: 1, sm: 2, lg: 4 },
    collapsible: true,
  },
  {
    key: "admin",
    title: "Administration",
    description: "Users, roles and system access",
    icon: "IconUsers",
    dir: "ltr",
    cols: { base: 1, sm: 2, lg: 3 },
  },
];

export const MODULES: ModuleDef[] = [
  /* ================= العمليات ================= */
  {
    key: "statistics",
    section: "operations",
    href: "/failures/stats",
    title: "احصائيات المخالفات",
    description: "عرض وتحليل احصائيات المخالفات، المؤشرات والبيانات التشغيلية.",
    footer: "فتح الاحصائيات",
    icon: "IconChartBar",
    color: "#2563EB",
  },
  {
    key: "daily_report",
    section: "operations",
    href: "/DailyReport",
    title: "التقرير اليومي",
    description: "التقرير اليومي، المؤشرات والبيانات التشغيلية.",
    footer: "فتح التقرير اليومي",
    icon: "IconFileText",
    color: "#2563EB",
  },
  {
    key: "wb_report",
    section: "operations",
    href: "/WBReport",
    title: "تقرير الاوزان اليومي",
    description: "تقرير الاوزان اليومي.",
    footer: "فتح تقرير الاوزان",
    icon: "IconFileText",
    color: "#2563EB",
  },
  {
    key: "analyzed_wb_report",
    section: "operations",
    href: "/analyzedWBReport",
    title: "تقرير الاوزان المحلل",
    description: "تقرير الاوزان المحلل.",
    footer: "فتح محلل تقرير الاوزان",
    icon: "IconFileText",
    color: "#2563EB",
  },
  {
    key: "vehicle_movements_history",
    section: "operations",
    href: "/vehicle-movements/history",
    title: "سجل حركة المركبات",
    description:
      "مراجعة وتحليل سجلات حركة المركبات التاريخية والنشاط التشغيلي.",
    footer: "فتح سجل الحركة",
    icon: "IconHistory",
    color: "#7C3AED",
  },
  {
    key: "vehicle_movements",
    section: "operations",
    href: "/vehicle-movements",
    title: "حركة المركبات",
    description:
      "مراقبة حركة المركبات، النشاط اليومي وسجلات الحركة التشغيلية.",
    footer: "فتح حركة المركبات",
    icon: "IconArrowsExchange",
    color: "#DB2777",
  },
  {
    key: "map",
    section: "operations",
    href: "/failures/osm",
    title: "خرائط المخالفات",
    description:
      "عرض المخالفات على الخرائط، مراجعة المواقع وتحليل البيانات الجغرافية.",
    footer: "فتح الخرائط",
    icon: "IconMap",
    color: "#F76707",
  },
  {
    key: "route_notes",
    section: "operations",
    href: "/route-notes",
    title: "ملاحظات تتبع المركبات",
    description:
      "عرض وإدارة ملاحظات تتبع المركبات، الملاحظات التشغيلية والمواقع.",
    footer: "فتح ملاحظات التتبع",
    icon: "IconRoute",
    color: "#FA5252",
  },
  {
    key: "bins",
    section: "operations",
    href: "/binCollection/map",
    title: "اداة جمع مواقع الحاويات",
    description:
      "عرض مواقع الحاويات على الخرائط، مراجعة المواقع وتحليل البيانات الجغرافية.",
    footer: "فتح خريطة الجمع",
    icon: "IconMapPin",
    color: "#FCC419",
  },
  {
    key: "collection_areas",
    section: "operations",
    href: "/binCollection/collection-areas/manage",
    title: "مناطق الجمع",
    description: "إدارة مناطق الجمع، المناطق والحدود التشغيلية.",
    footer: "إدارة المناطق",
    icon: "IconMap2",
    color: "#A1887F",
  },
  {
    key: "bin_export",
    section: "operations",
    href: "/binCollection/export-bins",
    title: "تصدير بيانات الحاويات",
    description: "تصدير بيانات الحاويات، المواقع والمعلومات التشغيلية.",
    footer: "تصدير البيانات",
    icon: "IconFileTypeXls",
    color: "#40C057",
  },

  /* ================= الصيانة ================= */
  {
    key: "maintenance",
    section: "maintenance",
    href: "/maintenance/management",
    title: "ادارة الصيانة",
    description: "ادخال و اخراج المركبات من والى الصيانة",
    footer: "فتح إدارة الصيانة",
    icon: "IconTool",
    color: "#40C057",
  },
  {
    key: "maintenance_history",
    section: "maintenance",
    href: "/maintenance/history",
    title: "سجلات الصيانة",
    description: "مشاهدة وتحليل سجلات الصيانة، الأعمال السابقة والتقارير.",
    footer: "فتح سجلات الصيانة",
    icon: "IconHistory",
    color: "#20C997",
  },
  {
    key: "maintenance_types",
    section: "maintenance",
    href: "/maintenance/setup",
    title: "انواع الصيانة",
    description: "ادارة أنواع الصيانة، الفئات والإعدادات الخاصة بها.",
    footer: "فتح إعدادات الصيانة",
    icon: "IconSettings",
    color: "#22B8CF",
  },
  {
    key: "vehicles",
    section: "maintenance",
    href: "/maintenance/vehicles",
    title: "المركبات",
    description: "إدارة المركبات ومعلوماتها.",
    footer: "فتح إدارة المركبات",
    icon: "IconTruck",
    color: "#74A7FF",
  },

  /* ================= Administration ================= */
  {
    key: "users",
    section: "admin",
    href: "/admin/users",
    title: "User Management",
    description: "Create, edit and manage system users and their roles.",
    footer: "Manage Users",
    icon: "IconUsers",
    color: "#228BE6",
  },
  {
    key: "roles",
    section: "admin",
    href: "/admin/roles",
    title: "Roles Management",
    description: "Create, edit and manage system roles and access levels.",
    footer: "Manage Roles",
    icon: "IconShield",
    color: "#845EF7",
  },
  {
    key: "permissions",
    section: "admin",
    href: "/admin/permissions",
    title: "Permissions Management",
    description: "Assign permissions to roles and control system access.",
    footer: "Manage Permissions",
    icon: "IconLock",
    color: "#F06595",
  },
];

/**
 * الصلاحية اللازمة لمسار معين.
 * بنختار أطول href بيطابق المسار، عشان /vehicle-movements/history
 * ما ياخد صلاحية /vehicle-movements.
 */
export function requiredPermissionFor(pathname: string): string | null {
  let best: ModuleDef | null = null;

  for (const m of MODULES) {
    const matches = pathname === m.href || pathname.startsWith(m.href + "/");
    if (matches && (!best || m.href.length > best.href.length)) best = m;
  }

  return best ? best.key : null;
}