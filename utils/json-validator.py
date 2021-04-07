#!/usr/bin/env python3

import os
import json
import sys
from jsonschema import validate, RefResolver

if len(sys.argv) < 3:
    print("Syntax:\n   {} <json data file> <json schema file>".format(sys.argv[0]))
    sys.exit(1);

with open(sys.argv[1]) as instanceF:
    instance = json.load(instanceF)
with open(sys.argv[2]) as schemaF:
    schema = json.load(schemaF)

# this is a directory name (root) where the 'grandpa' is located
dir = os.path.dirname(os.path.realpath(__file__))

schema_path = 'file:///{0}/'.format(dir)
resolver = RefResolver(schema_path, schema) # TODO: fix ref path
validate(instance, schema, resolver=resolver)
