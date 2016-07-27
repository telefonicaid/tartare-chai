/*

 Copyright 2015-2016 Telefonica Investigación y Desarrollo, S.A.U

 This file is part of Tartare.

 Tartare is free software: you can redistribute it and/or modify it under the
 terms of the Apache License as published by the Apache Software Foundation,
 either version 2.0 of the License, or (at your option) any later version.
 Tartare is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the Apache License for more details.

 You should have received a copy of the Apache License along with Tartare.
 If not, see http://www.apache.org/licenses/LICENSE-2.0

 For those usages not covered by the Apache License please contact with:
 joseantonio.rodriguezfernandez@telefonica.com

 */

'use strict';

var fs = require('fs');
var path = require('path');
var codependency = require('codependency');
var requireLazy = codependency.get('tartare-chai');

function _loadSchema(filename) {
  return fs.readFileSync(path.resolve(__dirname, filename), {encoding: 'utf-8'});
}

// Change UNICA_API_Errors_soapXX_vY schemas' import tag so the schemaLocation attribute points to a full path
function _fixSoapPaths(schema) {
  var importTag = schema.get('/xs:schema/xs:import', {xs: 'http://www.w3.org/2001/XMLSchema'});
  var currentSchemaLocation = importTag.attr('schemaLocation').value();
  importTag.attr('schemaLocation').value('file://' + path.resolve(__dirname, currentSchemaLocation));
  return schema;
}

var schemas = {
  soap11: {
    data: null,
    load: function load() {
      var xml = requireLazy('libxmljs');
      return xml.parseXmlString(_loadSchema('SOAP11_Envelope.xsd'));
    }
  },
  unicaApiErrors: {
    json: {
      v1: {
        data: null,
        load: function load() {
          return JSON.parse(_loadSchema('UNICA_API_Errors_json_v1.json'));
        }
      },
      v2: {
        data: null,
        load: function load() {
          return JSON.parse(_loadSchema('UNICA_API_Errors_json_v2.json'));
        }
      }
    },
    xml: {
      v1: {
        data: null,
        load: function load() {
          var xml = requireLazy('libxmljs');
          return xml.parseXmlString(_loadSchema('UNICA_API_Errors_xml_v1.xsd'));
        }
      },
      v2: {
        data: null,
        load: function load() {
          var xml = requireLazy('libxmljs');
          return xml.parseXmlString(_loadSchema('UNICA_API_Errors_xml_v2.xsd'));
        }
      }
    },
    soap11: {
      v1: {
        data: null,
        load: function load() {
          var xml = requireLazy('libxmljs');
          return _fixSoapPaths(xml.parseXmlString(_loadSchema('UNICA_API_Errors_soap11_v1.xsd')));
        }
      },
      v2: {
        data: null,
        load: function load() {
          var xml = requireLazy('libxmljs');
          return _fixSoapPaths(xml.parseXmlString(_loadSchema('UNICA_API_Errors_soap11_v2.xsd')));
        }
      }
    }
  }
};

// Recursive function that clones the `schemas` tree into the `module.exports`
// changing the leaf nodes by other ones that have a `get` function that
// lazily loads the schemas
function _buildCache(schemaNode, exportsNode) {
  Object.keys(schemaNode).forEach(function(property) {
    exportsNode[property] = {};
    if (schemaNode[property].load) {
      // It's a leaf node
      exportsNode[property].get = function get() {
        if (!schemaNode[property].data) {
          schemaNode[property].data = schemaNode[property].load();
        }
        return schemaNode[property].data;
      };
    } else {
      _buildCache(schemaNode[property], exportsNode[property]);
    }
  });
}

module.exports = {};
_buildCache(schemas, module.exports);
