"use client";

import { Modal, Stack, Text } from "@mantine/core";

export default function ActivitiesModal({ opened, onClose, activities }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Activities Details"
      size="xl"
    >
      {activities.length === 0 ? (
        <Text>No activities found</Text>
      ) : (
        activities.map((activity, index) => (
          <Stack
            key={index}
            mb="lg"
            p="md"
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
            }}
          >
            <Text>
              <b>Activity Type:</b> {activity.activityType}
            </Text>

            <Text>
              <b>User Name:</b> {activity.userName}
            </Text>

            <Text>
              <b>Old Value:</b> {activity.oldValue || "-"}
            </Text>

            <Text>
              <b>New Value:</b> {activity.newValue || "-"}
            </Text>

            <Text>
              <b>Staff Party:</b> {activity.staffParty || "-"}
            </Text>

            <Text>
              <b>Is AVTR Staff:</b> {activity.isAvtrStaff ? "Yes" : "No"}
            </Text>

            <Text>
              <b>Comments:</b> {activity.commentsAr || "-"}
            </Text>
          </Stack>
        ))
      )}
    </Modal>
  );
}
