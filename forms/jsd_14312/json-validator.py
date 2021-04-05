#!/usr/bin/env python3

import os
import json
from jsonschema import validate, RefResolver

with open("../../tmp/LeRa002854_DN_PODD_fixed.json") as instanceF:
    instance = json.load(instanceF)
with open("jsd-schema.json") as schemaF:
    schema = json.load(schemaF)

# this is a directory name (root) where the 'grandpa' is located
dir = os.path.dirname(os.path.realpath(__file__))

schema_path = 'file:///{0}/'.format(dir)
resolver = RefResolver(schema_path, schema)
validate(instance, schema, resolver=resolver)
