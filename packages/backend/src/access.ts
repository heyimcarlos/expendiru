const carlosEmail = "carlos.cruzta@gmail.com";
const mariaEmail = "mariaeduarda.frdo@gmail.com";

const allow = "allow" as const;

export const householdEmails = [carlosEmail, mariaEmail];

export const householdAllowPolicy = {
  decision: allow,
  name: "Carlos and Maria",
  include: [{ email: carlosEmail }, { email: mariaEmail }],
};
