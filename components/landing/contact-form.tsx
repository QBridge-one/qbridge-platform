"use client";

import { useState } from "react";
import { T, labelStyle } from "./shared";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  fontSize: 15,
  color: T.coldW,
  background: "rgba(20, 52, 90, 0.4)",
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
};

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          company: formData.get("company") || undefined,
          message: formData.get("message"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Failed to send. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: 48,
          textAlign: "center",
          border: `1px solid ${T.border}`,
          borderRadius: 8,
        }}
      >
        <p style={{ color: T.warm, fontSize: 16, fontWeight: 600 }}>
          Thank you. We&apos;ll be in touch soon.
        </p>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 8 }}>
          Your message has been sent to our team.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div className="contact-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <label htmlFor="name" style={{ ...labelStyle, display: "block", marginBottom: 8 }}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            style={inputStyle}
            disabled={status === "loading"}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.navyBdr)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
          />
        </div>
        <div>
          <label htmlFor="email" style={{ ...labelStyle, display: "block", marginBottom: 8 }}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            style={inputStyle}
            disabled={status === "loading"}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.navyBdr)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="company" style={{ ...labelStyle, display: "block", marginBottom: 8 }}>
          Company / Institution
        </label>
        <input
          id="company"
          name="company"
          type="text"
          style={inputStyle}
          disabled={status === "loading"}
          onFocus={(e) => (e.currentTarget.style.borderColor = T.navyBdr)}
          onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
        />
      </div>

      <div>
        <label htmlFor="message" style={{ ...labelStyle, display: "block", marginBottom: 8 }}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
          disabled={status === "loading"}
          onFocus={(e) => (e.currentTarget.style.borderColor = T.navyBdr)}
          onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
        />
      </div>

      {errorMsg && (
        <p style={{ color: "#e57373", fontSize: 14 }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          background: T.warm,
          color: T.navy,
          padding: "16px 40px",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          border: "none",
          cursor: status === "loading" ? "wait" : "pointer",
          fontFamily: "'DM Mono', monospace",
          alignSelf: "flex-start",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
