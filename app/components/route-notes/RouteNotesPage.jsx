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

  const [district, setDistrict] =
    useState(null);

  const [notes, setNotes] =
    useState([]);

  const [editingNote, setEditingNote] =
    useState(null);

  const [error, setError] =
    useState("");

  // ========================================
  // Add / Update
  // ========================================

  const handleSaveNote = (note) => {
    setError("");

    // ======================================
    // Check duplicate
    //
    // المنطقة + القطعة
    //
    // أثناء التعديل نستثني نفس ID
    // ======================================

    const duplicate = notes.find(
      (item) =>
        item.id !== note.id &&
        item.district === note.district &&
        item.block === note.block
    );

    // ======================================
    // Duplicate
    // ======================================

    if (duplicate) {
      setError(
        `القطعة "${note.block}" في منطقة "${note.district}" مسجلة مسبقًا.`
      );

      // إلغاء وضع التعديل
      setEditingNote(null);

      // نخلي المنطقة موجودة
      // لكن الفورم نفسه سيتم تنظيفه
      setDistrict(note.district);

      return false;
    }

    // ======================================
    // Update
    // ======================================

    if (editingNote) {
      setNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? note
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

    return true;
  };

  // ========================================
  // Start Edit
  // ========================================

  const handleEdit = (note) => {
    setError("");

    setDistrict(note.district);

    setEditingNote(note);
  };

  // ========================================
  // Cancel Edit
  // ========================================

  const handleCancelEdit = () => {
    setEditingNote(null);

    setError("");
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

    setNotes((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );

    // إذا كان يحذف الملاحظة
    // التي يتم تعديلها حاليًا
    if (
      editingNote?.id === id
    ) {
      setEditingNote(null);
    }
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
            <IconAlertCircle
              size={18}
            />
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
            onDistrictChange={
              setDistrict
            }
            onSaveNote={
              handleSaveNote
            }
            editingNote={
              editingNote
            }
            onCancelEdit={
              handleCancelEdit
            }
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
            onEdit={
              handleEdit
            }
            onDelete={
              handleDelete
            }
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}