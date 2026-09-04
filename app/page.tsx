"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

import { IconArrowRight, IconLock, IconUser } from "@tabler/icons-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { bungee } from "./layout";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setError("حدث خطأ أثناء تسجيل الدخول");
        return;
      }

      if (result.error) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      router.push("/Home");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);

      setError("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="background-grid" />

      <div className="glow glow-one" />
      <div className="glow glow-two" />

      {/* ================================================= */}
      {/* CONTAINER */}
      {/* ================================================= */}

      <Container
        size={460}
        px="md"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
        }}
      >
        <Center mih="100vh">
          {/* ================================================= */}
          {/* LOGIN CARD */}
          {/* ================================================= */}

          <Paper
            className="login-card"
            radius="xl"
            p={{
              base: 28,
              sm: 40,
            }}
            withBorder
          >
            <Stack gap={30}>
              {/* ================================================= */}
              {/* LOGO */}
              {/* ================================================= */}

              <Box
                className="ops-header"
                style={{
                  textAlign: "center",
                }}
              >
                <Box
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {/* MATRIX */}

                  <Text
                    component="span"
                    className={`${bungee.className} matrix-title`}
                  >
                    Matrix
                  </Text>
                  {/* OPS */}

                  <Text component="span" className="ops-title">
                    Ops
                  </Text>
                </Box>

                <Text className="ops-subtitle">Operations Intelligence</Text>
              </Box>

              {/* ================================================= */}
              {/* WELCOME */}
              {/* ================================================= */}

              <Stack align="center" gap={5}>
                <Text fw={700} size="xl" c="#263746">
                  Welcome Back
                </Text>

                <Text size="sm" c="dimmed" ta="center">
                  Sign in to access your operations dashboard
                </Text>
              </Stack>

              {/* ================================================= */}
              {/* ERROR */}
              {/* ================================================= */}

              {error && (
                <Paper
                  p="sm"
                  radius="md"
                  bg="rgba(250, 82, 82, 0.07)"
                  withBorder
                  style={{
                    borderColor: "rgba(250, 82, 82, 0.20)",
                  }}
                >
                  <Text size="sm" c="red" ta="center" fw={500}>
                    {error}
                  </Text>
                </Paper>
              )}

              {/* ================================================= */}
              {/* LOGIN FORM */}
              {/* ================================================= */}

              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  {/* USERNAME */}

                  <TextInput
                    label="Username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) => setUsername(event.currentTarget.value)}
                    leftSection={<IconUser size={18} stroke={1.7} />}
                    size="md"
                    radius="md"
                    autoComplete="username"
                    disabled={loading}
                  />

                  {/* PASSWORD */}

                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    leftSection={<IconLock size={18} stroke={1.7} />}
                    size="md"
                    radius="md"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  {/* FORGOT PASSWORD */}

                  <Group justify="flex-end" mt={-4}>
                    <Anchor
                      href="/forgot-password"
                      size="sm"
                      fw={500}
                      c="#228be6"
                      underline="hover"
                    >
                      Forgot password?
                    </Anchor>
                  </Group>

                  {/* LOGIN BUTTON */}

                  <Button
                    type="submit"
                    size="md"
                    radius="md"
                    fullWidth
                    loading={loading}
                    rightSection={
                      !loading && <IconArrowRight size={19} stroke={2} />
                    }
                    variant="gradient"
                    gradient={{
                      from: "#1864ab",
                      to: "#15aabf",
                      deg: 90,
                    }}
                    mt={4}
                    styles={{
                      root: {
                        boxShadow: "0 8px 20px rgba(34, 139, 230, 0.20)",
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>

              {/* ================================================= */}
              {/* FOOTER */}
              {/* ================================================= */}

              <Stack align="center" gap={4} mt={2}>
                <Text size="xs" c="dimmed" ta="center">
                  Secure Operations Management System
                </Text>

                <Text size="xs" c="dimmed" opacity={0.6}>
                  © {new Date().getFullYear()} Ops Matrix
                </Text>
              </Stack>
            </Stack>
          </Paper>
        </Center>
      </Container>

      {/* ================================================= */}
      {/* STYLES */}
      {/* ================================================= */}

      <style jsx global>{`
        /* ================================================
           HTML / BODY
        ================================================ */

        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }

        body {
          background: #f8fafc;
        }

        /* ================================================
           PAGE
        ================================================ */

        .login-page {
          min-height: 100vh;

          position: relative;

          overflow: hidden;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            radial-gradient(
              circle at 10% 15%,
              rgba(34, 139, 230, 0.1),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 85%,
              rgba(18, 184, 134, 0.08),
              transparent 28%
            ),
            #f8fafc;
        }

        /* ================================================
           GRID
        ================================================ */

        .background-grid {
          position: absolute;

          inset: 0;

          pointer-events: none;

          opacity: 0.4;

          background-image:
            linear-gradient(rgba(30, 50, 65, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 50, 65, 0.035) 1px, transparent 1px);

          background-size: 32px 32px;

          mask-image: linear-gradient(to bottom, black, transparent 90%);
        }

        /* ================================================
           GLOW
        ================================================ */

        .glow {
          position: absolute;

          width: 280px;

          height: 280px;

          border-radius: 50%;

          filter: blur(80px);

          pointer-events: none;

          opacity: 0.25;
        }

        .glow-one {
          top: -120px;

          left: -100px;

          background: #228be6;
        }

        .glow-two {
          right: -120px;

          bottom: -120px;

          background: #12b886;
        }

        /* ================================================
           CARD
        ================================================ */

        .login-card {
          width: 100%;

          background: rgba(255, 255, 255, 0.9);

          backdrop-filter: blur(20px);

          -webkit-backdrop-filter: blur(20px);

          border-color: rgba(30, 50, 65, 0.08);

          box-shadow:
            0 30px 70px rgba(15, 23, 42, 0.08),
            0 10px 30px rgba(15, 23, 42, 0.04);
        }

        /* ================================================
           OPS MATRIX
        ================================================ */

        .ops-title {
          font-family: Inter, sans-serif;

          font-size: clamp(34px, 5vw, 48px);

          font-weight: 600;

          letter-spacing: -2px;

          color: #263746;

          line-height: 1;
        }

        .matrix-title {
          font-size: clamp(34px, 4.5vw, 46px);

          line-height: 1;

          background: linear-gradient(
            110deg,
            #1864ab 0%,
            #228be6 40%,
            #15aabf 75%,
            #12b886 100%
          );

          -webkit-background-clip: text;

          background-clip: text;

          -webkit-text-fill-color: transparent;

          display: inline-block;

          letter-spacing: 0;
        }

        /* ================================================
           SUBTITLE
        ================================================ */

        .ops-subtitle {
          margin-top: 14px;

          font-family: Inter, sans-serif;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 2.4px;

          text-transform: uppercase;

          color: rgba(30, 50, 65, 0.52);
        }

        /* ================================================
           INPUTS
        ================================================ */

        .login-card .mantine-TextInput-input,
        .login-card .mantine-PasswordInput-input {
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .login-card .mantine-TextInput-input:focus,
        .login-card .mantine-PasswordInput-input:focus {
          border-color: #228be6;

          box-shadow: 0 0 0 2px rgba(34, 139, 230, 0.1);
        }

        /* ================================================
           MOBILE
        ================================================ */

        @media (max-width: 576px) {
          .login-page {
            padding: 16px;
          }

          .login-card {
            padding: 26px 20px;
          }

          .ops-title {
            font-size: 34px;
          }

          .matrix-title {
            font-size: 34px;
          }

          .ops-subtitle {
            font-size: 9px;

            letter-spacing: 1.8px;
          }
        }
      `}</style>
    </main>
  );
}
