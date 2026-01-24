import { Mail } from "fastforwardit";

export const mailer = new Mail({
  transporterOptions: {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  defaultFrom: process.env.EMAIL_USER || "",
});