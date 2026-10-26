FROM docker:24-dind

# Sandbox isolation image: strictly no AWS credentials injected
RUN apk add --no-cache curl python3 py3-pip bash

WORKDIR /sandbox

# Default command to run
CMD ["sh"]
