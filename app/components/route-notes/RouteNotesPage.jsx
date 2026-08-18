"use client";

import { useState } from "react";

import {
  Alert,
  Grid,
  Stack,
  Title,
} from "@mantine/core";

import {
  IconAlertCircle,
} from "@tabler/icons-react";

import RouteNotesForm from "./RouteNotesForm";
import RouteNotesList from "./RouteNotesList";

export default function RouteNotesPage() {
  // ========================================
  // State
  // ========================================

  const [district, setDistrict] = useState(null);

  const [notes, setNotes] = useState([]);

  const [editingNote, setEditingNote] = useState(null);

  const [error, setError] = useState("");

  // ========================================
  // Add / Update Note
  // ========================================


const handleSaveNote = (note) => {
  setError("");

  // ======================================
  // إذا كانت هناك ملاحظات مسجلة
  // يجب أن تكون جميعها لنفس المنطقة
  // ======================================

  if (notes.length > 0) {
    const currentDistrict =
      notes[0].district;

    if (
      note.district !== currentDistrict
    ) {
      setError(
        `المنطقة الحالية هي "${currentDistrict}" ولا يمكن تسجيل ملاحظات لمنطقة "${note.district}".`
      );

      setDistrict(currentDistrict);

      return false;
    }
  }

  // ======================================
  // Update
  // ======================================

  if (editingNote) {
    setNotes((current) =>
      current.map((item) =>
        item.id === note.id
          ? {
              ...item,
              ...note,
            }
          : item
      )
    );

    setEditingNote(null);

    return true;
  }

  // ======================================
  // Add
  // ======================================

  setNotes((current) => [
    note,
    ...current,
  ]);

  // تثبيت المنطقة
  setDistrict(note.district);

  return true;
};

  // ========================================
  // Start Edit
  // ========================================

  const handleEdit = (note) => {
    setError("");

    // تثبيت المنطقة أثناء التعديل
    setDistrict(note.district);

    setEditingNote(note);
  };

  // ========================================
  // Cancel Edit
  // ========================================

  const handleCancelEdit = () => {
    setEditingNote(null);

    setError("");

    // إذا كانت هناك ملاحظات
    // نحافظ على منطقتها
    if (notes.length > 0) {
      setDistrict(notes[0].district);
    }
  };

  // ========================================
  // Delete
  // ========================================

  const handleDelete = (id) => {
    setError("");

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف هذه الملاحظة؟"
      );

    if (!confirmed) {
      return;
    }

    setNotes((current) => {
      const updated = current.filter(
        (item) => item.id !== id
      );

      // ====================================
      // إذا لم تعد هناك ملاحظات
      // نسمح باختيار منطقة جديدة
      // ====================================

      if (updated.length === 0) {
        setDistrict(null);
      }

      return updated;
    });

    // ======================================
    // إذا كان يحذف الملاحظة
    // التي يتم تعديلها حاليًا
    // ======================================

    if (editingNote?.id === id) {
      setEditingNote(null);
    }
  };
// ========================================
// Reset District
// ========================================

const handleResetDistrict = () => {
  setError("");

  // لا يوجد شيء لإعادة تعيينه
  if (!district) {
    return;
  }

  // إذا كانت هناك ملاحظات
  // نطلب تأكيد قبل حذفها
  if (notes.length > 0) {
    const confirmed = window.confirm(
      `هل أنت متأكد من إعادة تعيين المنطقة؟\n\nسيتم حذف ${notes.length} ملاحظة مسجلة للمنطقة "${district}".`
    );

    if (!confirmed) {
      return;
    }
  }

  // تنظيف كل شيء
  setNotes([]);

  setDistrict(null);

  setEditingNote(null);

  setError("");
};
  // ========================================
  // UI
  // ========================================

  return (
    <Stack
      p="xl"
      gap="lg"
      dir="rtl"
    >
      {/* ================================== */}
      {/* Page Header */}
      {/* ================================== */}

      <Stack gap={2}>
        <Title order={2}>
          Route Notes
        </Title>
      </Stack>

      {/* ================================== */}
      {/* Error */}
      {/* ================================== */}

      {error && (
        <Alert
          color="red"
          radius="md"
          variant="light"
          icon={
            <IconAlertCircle size={18} />
          }
          withCloseButton
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {/* ================================== */}
      {/* Main */}
      {/* ================================== */}

      <Grid
        gutter="lg"
        align="start"
      >
        {/* ================================= */}
        {/* Form */}
        {/* ================================= */}

        <Grid.Col
          span={{
            base: 12,
            lg: 5,
          }}
        >
        <RouteNotesForm
  district={district}
  onDistrictChange={setDistrict}
  onSaveNote={handleSaveNote}
  editingNote={editingNote}
  onCancelEdit={handleCancelEdit}
  districtDisabled={notes.length > 0}
  onResetDistrict={handleResetDistrict}
/>
        </Grid.Col>

        {/* ================================= */}
        {/* List */}
        {/* ================================= */}

        <Grid.Col
          span={{
            base: 12,
            lg: 7,
          }}
        >
          <RouteNotesList
            district={district}
            notes={notes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}