#!/bin/bash

echo "🧪 TEST COMPLET DE TOUS LES COMPTES UTILISATEURS"
echo "=================================================="

# Fonction pour tester un compte
test_account() {
    local email=$1
    local password=$2
    local role_expected=$3

    echo "Test: $email"
    RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
      -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$email\", \"password\": \"$password\"}")

    if echo "$RESPONSE" | grep -q "access_token"; then
        echo "✅ SUCCÈS - Connexion réussie"
        USER_TYPE=$(echo "$RESPONSE" | jq -r '.user.user_type // "non spécifié"')
        EMAIL_FOUND=$(echo "$RESPONSE" | jq -r '.user.email // "email non trouvé"')
        echo "   📧 Email: $EMAIL_FOUND"
        echo "   👤 Type: $USER_TYPE"

        # Test d'accès aux données
        TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
        echo "   🔐 Token: ${TOKEN:0:20}..."

        # Test API REST
        API_TEST=$(curl -s -X GET \
          'http://127.0.0.1:54321/rest/v1/properties?select=title,city&limit=1' \
          -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
          -H "Authorization: Bearer $TOKEN")

        if echo "$API_TEST" | grep -q "title"; then
            echo "   🌐 API REST: ✅ Accessible"
        else
            echo "   🌐 API REST: ❌ Non accessible"
        fi
    else
        echo "❌ ÉCHEC - Connexion échouée"
        if echo "$RESPONSE" | grep -q "invalid_credentials"; then
            echo "   💡 Erreur: Identifiants incorrects"
        fi
    fi
    echo ""
}

# Test de tous les comptes
echo "🏠 Compte propriétaire (déjà existant)"
test_account "proprietaire@test.com" "test123" "proprietaire"

echo "🏠 Compte locataire"
test_account "locataire@mon-toit.ci" "locataire123" "locataire"

echo "🏢 Compte agence"
test_account "agence@mon-toit.ci" "agence123" "agence"

echo "👑 Compte admin"
test_account "admin@mon-toit.ci" "admin12345" "admin"

echo "🔐 Compte super admin"
test_account "super@mon-toit.ci" "super12345" "super_admin"

echo "🏛️ Compte tiers de confiance"
test_account "tiers@mon-toit.ci" "tiers12345" "tiers_de_confiance"

echo "=================================================="
echo "✅ Tests terminés !"