FROM n8nio/n8n:latest

USER root

# Install any necessary system packages
RUN apk add --update --no-cache curl build-base

USER node

# Expose the port
EXPOSE 5678

# Start n8n
CMD ["n8n", "start"]
