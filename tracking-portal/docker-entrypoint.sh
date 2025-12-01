#!/bin/sh
set -e

# Default API URL if not provided
API_URL=${VITE_API_URL:-http://operator-interface-service:3004}

# Inject API URL as a global variable in the HTML
# This will be available as window.__API_URL__ in the JavaScript
if [ -f /usr/share/nginx/html/index.html ]; then
  # Escape the URL for sed
  ESCAPED_URL=$(echo "$API_URL" | sed 's/[[\.*^$()+?{|]/\\&/g')
  
  # Inject script tag before closing </head> tag
  sed -i "s|</head>|<script>window.__API_URL__='${ESCAPED_URL}';</script></head>|g" /usr/share/nginx/html/index.html
  
  echo "API URL injected into HTML: ${API_URL}"
else
  echo "Warning: index.html not found, skipping API URL injection"
fi

# Execute the main command
exec "$@"

