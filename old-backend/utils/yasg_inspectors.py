"""Taken from https://gist.github.com/Safrone/8035d7e666cbedfba919b04404a003d2
"""

import re

from drf_yasg.inspectors import SerializerInspector
from drf_yasg import openapi
from rest_polymorphic.serializers import PolymorphicSerializer # type: ignore


class PolymorphicSerializerInspector(SerializerInspector):
    """Custome inspector for YASG documentation for polymorphic models"""
    def _get_definition_name(self, ref):
        regex_match = re.search(r"#/definitions/(?P<definition_name>\w+)", ref)
        if regex_match:
            return regex_match.group('definition_name')
        return None

    def _get_schema_ref(self, serializer):
        schema_ref = self.probe_inspectors(
            self.field_inspectors, 'get_schema', serializer, {
                'field_inspectors': self.field_inspectors
            }
        )
        return schema_ref

    def _get_schema(self, serializer, schema_ref=None):
        if schema_ref is None:
            schema_ref = self._get_schema_ref(serializer)
        schema = openapi.resolve_ref(schema_ref, self.components)
        return schema

    def process_result(self, result, method_name, obj, **kwargs):
        if isinstance(result, openapi.Schema.OR_REF) and issubclass(obj.__class__,
                                                                    PolymorphicSerializer):
            definitions = self.components._objects['definitions']
            definition_name = self._get_definition_name(result['$ref'])
            definitions.pop(definition_name, None)

            base_model_name = obj.base_serializer_class.Meta.model._meta.object_name
            base_ref = '#/definitions/{}'.format(base_model_name)
            if base_model_name not in definitions:
                schema = self._get_schema(obj.base_serializer_class())
                schema['discriminator'] = obj.resource_type_field_name
                schema['required'] = schema.setdefault('required', []) + [obj.resource_type_field_name]
                schema['properties'][obj.resource_type_field_name] = openapi.Schema(
                    title=obj.resource_type_field_name, type=openapi.TYPE_STRING,
                    enum=[obj.to_resource_type(model) for model in obj.model_serializer_mapping.keys()]
                )
                definitions[base_model_name] = schema

            for model, serializer in obj.model_serializer_mapping.items():
                if serializer is None:
                    serializer = obj.base_serializer_class()
                discriminator = model._meta.object_name
                if discriminator not in definitions:
                    schema_ref = self._get_schema_ref(serializer)
                    all_of = [
                        {'$ref': base_ref}
                    ]
                    if schema_ref['$ref'] != base_ref:
                        model_schema = self._get_schema(serializer, schema_ref=schema_ref)
                        # Avoid doubling up on properties from base serializer
                        for prop in definitions.get(base_model_name, {}).get('properties'):
                            model_schema['properties'].pop(prop, None)
                        all_of.append(model_schema)
                    definitions[discriminator] = openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        allOf=all_of
                    )
            result['$ref'] = base_ref
        return result
