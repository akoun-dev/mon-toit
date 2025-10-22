#!/bin/bash

echo "=== Test des comptes d'authentification ==="
echo ""

# Test locataire
echo "1. Test locataire@test.com:"
RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"email": "locataire@test.com", "password": "test123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ SUCCÈS - Compte locataire fonctionne"
  USER_INFO=$(echo "$RESPONSE" | jq -r '.user.email + " (" + .user.user_type + ")"')
  echo "   Utilisateur: $USER_INFO"
else
  echo "❌ ÉCHEC - Compte locataire ne fonctionne pas"
fi
echo ""

# Test proprietaire
echo "2. Test proprietaire@test.com:"
RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"email": "proprietaire@test.com", "password": "test123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ SUCCÈS - Compte proprietaire fonctionne"
  USER_INFO=$(echo "$RESPONSE" | jq -r '.user.email + " (" + .user.user_type + ")"')
  echo "   Utilisateur: $USER_INFO"
else
  echo "❌ ÉCHEC - Compte proprietaire ne fonctionne pas"
fi
echo ""

# Test admin
echo "3. Test admin@test.com:"
RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ SUCCÈS - Compte admin fonctionne"
  USER_INFO=$(echo "$RESPONSE" | jq -r '.user.email + " (" + .user.user_type + ")"')
  echo "   Utilisateur: $USER_INFO"
else
  echo "❌ ÉCHEC - Compte admin ne fonctionne pas"
fi
echo ""

# Test compte original
echo "4. Test testuser@mon-toit.ci:"
RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@mon-toit.ci", "password": "test12345"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ SUCCÈS - Compte test original fonctionne"
  USER_INFO=$(echo "$RESPONSE" | jq -r '.user.email + " (" + .user.user_type + ")"')
  echo "   Utilisateur: $USER_INFO"
else
  echo "❌ ÉCHEC - Compte test original ne fonctionne pas"
fi

echo ""
echo "=== Test d'accès aux données avec un compte fonctionnel ==="