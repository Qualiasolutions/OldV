#-----------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root for license information.
#-----------------------------------------------------------------------------------------

ARG VARIANT="3.11"
FROM mcr.microsoft.com/vscode/devcontainers/python:0-${VARIANT}

# Copy default endpoint specific user settings overrides into container to specify Python path
# COPY .devcontainer/settings.vscode.json /root/.vscode-remote/data/Machine/settings.json

ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH "/usr/local/bin/python3.11:/workspace"

RUN mkdir /workspace
WORKDIR /workspace

ENV SHELL /bin/bash

# Install git, process tools
RUN apt-get update && apt-get -y install git procps

# Install Python dependencies from requirements.txt
COPY requirements.txt /workspace/
RUN pip install -r requirements.txt

# Install Python dependencies from requirements.txt.dev
COPY requirements.txt.dev /workspace/
RUN pip install -r requirements.txt.dev

# Clean up
RUN apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*
