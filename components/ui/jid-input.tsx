"use client";

import { useState } from "react";

function normalizeJid(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return `${digits}@s.whatsapp.net`;
}

export function JIDInput() {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <input
        className="input-field"
        placeholder="+8801..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">Normalized: {value ? normalizeJid(value) : "-"}</p>
    </div>
  );
}
