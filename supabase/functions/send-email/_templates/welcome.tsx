import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface WelcomeEmailProps {
  userName: string;
  userType: string;
}

export const WelcomeEmail = ({ userName, userType }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue sur MZAKA - Votre plateforme de location sécurisée</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenue sur MZAKA ! 🏠</Heading>
        
        <Text style={text}>Bonjour {userName},</Text>
        
        <Text style={text}>
          Nous sommes ravis de vous accueillir sur MZAKA, la plateforme de location
          immobilière au Burkina Faso.
        </Text>

        <Section style={box}>
          <Text style={boxText}>
            En tant que <strong>{userType === "bailleur" ? "propriétaire" : "locataire"}</strong>,
            vous avez accès à :
          </Text>
          <Text style={boxText}>
            ✓ Des baux vérifiés par l'équipe MZAKA<br />
            ✓ Paiements sécurisés par Mobile Money<br />
            ✓ Vérification d'identité CNIB/CNAM<br />
            ✓ Messagerie intégrée<br />
            ✓ Tableau de bord complet
          </Text>
        </Section>

        <Text style={text}>
          <strong>Prochaines étapes :</strong>
        </Text>
        <Text style={text}>
          1. Complétez votre profil<br />
          2. Vérifiez votre identité (CNIB/CNAM)<br />
          3. {userType === "bailleur" ? "Publiez votre premier bien" : "Recherchez votre logement idéal"}
        </Text>

        <Link href={`${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://").split(".supabase.co")[0]}.lovable.app/dashboard`} style={button}>
          Accéder à mon tableau de bord
        </Link>

        <Hr style={hr} />
        
        <Text style={footer}>
          MZAKA - Plateforme de location immobilière<br />
          Burkina Faso
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  padding: "0 40px",
};

const box = {
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "20px",
};

const boxText = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "8px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  display: "block",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  margin: "32px 40px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 40px",
};
