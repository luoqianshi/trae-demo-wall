import asyncio
import json
import traceback

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("tia-portal-mcp-server")

def _check_tia() -> str:
    """Check TIA Portal initialization status (delegates to _common._get_eng).
    Uses lazy import to avoid crashing at startup if TIA Portal is not installed."""
    try:
        from ._common import _get_eng
        _get_eng()  # triggers lazy init
        return None
    except Exception as e:
        return str(e)

# Empty schema for tools with no parameters
EMPTY_SCHEMA = {"type": "object", "properties": {}, "required": []}

# Common schemas
PROJECT_PATH_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file (.ap16)"}
    },
    "required": ["project_path"]
}

PROJECT_OPEN_GUI_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file (.ap16)"},
        "mode": {"type": "string", "description": "Connection mode: 'WithUserInterface' to attach to running GUI, 'WithoutUserInterface' for headless", "enum": ["WithUserInterface", "WithoutUserInterface"], "default": "WithoutUserInterface"}
    },
    "required": ["project_path"]
}

PROJECT_CREATE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Directory path for new project"},
        "project_name": {"type": "string", "description": "Name of the new project"}
    },
    "required": ["project_path", "project_name"]
}

BLOCK_EXPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_name": {"type": "string", "description": "Name of the block to export"},
        "output_dir": {"type": "string", "description": "Directory to save exported XML"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_name", "output_dir"]
}

BLOCKS_EXPORT_ALL_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "output_dir": {"type": "string", "description": "Directory to save exported blocks"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "output_dir"]
}

BLOCK_IMPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_xml_path": {"type": "string", "description": "Path to XML file to import"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_xml_path"]
}

VARIABLE_TABLE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path"]
}

VARIABLE_ADD_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "var_name": {"type": "string", "description": "Variable name"},
        "data_type": {"type": "string", "description": "Data type (e.g., Bool, Int, Real)"},
        "address": {"type": "string", "description": "Memory address (e.g., I0.0, MW10)"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "var_name", "data_type", "address"]
}

VARIABLE_MODIFY_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "var_name": {"type": "string", "description": "Variable name to modify"},
        "data_type": {"type": "string", "description": "New data type (e.g., Bool, Int). Omit to keep current."},
        "address": {"type": "string", "description": "New memory address (e.g., %M10.0). Omit to keep current."},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "var_name"]
}

VARIABLE_DELETE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "var_name": {"type": "string", "description": "Variable name to delete"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "var_name"]
}

VARIABLES_EXPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "output_path": {"type": "string", "description": "Output file path"},
        "format": {"type": "string", "description": "Export format: json or csv", "enum": ["json", "csv"]},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "output_path"]
}

DEVICE_PROPERTIES_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "device_name": {"type": "string", "description": "Device name (optional, returns all if not specified)"}
    },
    "required": ["project_path"]
}

PLC_CHECK_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path"]
}

BATCH_COMPILE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_names": {"type": "array", "items": {"type": "string"}, "description": "List of block names to compile"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_names"]
}

BATCH_COPY_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_mappings": {"type": "array", "items": {"type": "object", "properties": {"source": {"type": "string"}, "target": {"type": "string"}}}, "description": "List of {source, target} mappings"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_mappings"]
}

BATCH_DELETE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_names": {"type": "array", "items": {"type": "string"}, "description": "List of block names to delete"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_names"]
}

BLOCK_DELETE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_name": {"type": "string", "description": "Name of the block to delete (also deletes external source)"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_name"]
}

BLOCKS_UPDATE_EXT_SRC_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_name": {"type": "string", "description": "Name of the block to update"},
        "scl_file_path": {"type": "string", "description": "Path to the SCL source file"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_name", "scl_file_path"]
}

BLOCKS_RECOMPILE_ALL_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "scl_dir": {"type": "string", "description": "Directory containing SCL source files"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"},
        "build_order": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}, "description": "Optional build order as list of [block_name, filename] pairs. If omitted, auto-discovers all .scl/.db files"}
    },
    "required": ["project_path", "scl_dir"]
}

LADDER_GENERATE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_path": {"type": "string", "description": "Path to TIA Portal project file"},
        "block_name": {"type": "string", "description": "Name of the new block"},
        "networks": {"type": "array", "description": "List of network definitions with rungs and elements"},
        "plc_name": {"type": "string", "description": "PLC name (optional)"}
    },
    "required": ["project_path", "block_name"]
}

LADDER_VALIDATE_SCHEMA = {
    "type": "object",
    "properties": {
        "ladder_logic": {"type": "object", "description": "Ladder logic structure to validate"}
    },
    "required": ["ladder_logic"]
}

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(name="ping", description="Health check", inputSchema=EMPTY_SCHEMA),
        Tool(name="project_create", description="Create new TIA Portal project", inputSchema=PROJECT_CREATE_SCHEMA),
        Tool(name="project_open", description="Open existing TIA Portal project", inputSchema=PROJECT_PATH_SCHEMA),
        Tool(name="project_open_gui", description="Open project with GUI attach mode (attach to running TIA Portal GUI instance)", inputSchema=PROJECT_OPEN_GUI_SCHEMA),
        Tool(name="project_save", description="Save current project", inputSchema=EMPTY_SCHEMA),
        Tool(name="project_get_info", description="Get current project information", inputSchema=EMPTY_SCHEMA),
        Tool(name="project_close", description="Close current project", inputSchema=EMPTY_SCHEMA),
        Tool(name="block_export", description="Export a single block to XML", inputSchema=BLOCK_EXPORT_SCHEMA),
        Tool(name="blocks_export_all", description="Export all blocks from project", inputSchema=BLOCKS_EXPORT_ALL_SCHEMA),
        Tool(name="block_import", description="Import block from XML file", inputSchema=BLOCK_IMPORT_SCHEMA),
        Tool(name="variable_table_get", description="Get all PLC variables", inputSchema=VARIABLE_TABLE_SCHEMA),
        Tool(name="variable_add", description="Add a new PLC variable", inputSchema=VARIABLE_ADD_SCHEMA),
        Tool(name="variable_modify", description="Modify PLC variable address or data type (deletes and recreates under the hood - V16 limitation)", inputSchema=VARIABLE_MODIFY_SCHEMA),
        Tool(name="variable_delete", description="Delete a PLC variable", inputSchema=VARIABLE_DELETE_SCHEMA),
        Tool(name="variables_export", description="Export variables to CSV or JSON", inputSchema=VARIABLES_EXPORT_SCHEMA),
        Tool(name="device_scan", description="Scan and list all devices", inputSchema=PROJECT_PATH_SCHEMA),
        Tool(name="device_get_structure", description="Get device tree structure", inputSchema=PROJECT_PATH_SCHEMA),
        Tool(name="device_get_properties", description="Get device properties", inputSchema=DEVICE_PROPERTIES_SCHEMA),
        Tool(name="plc_check", description="Check PLC block consistency status (does NOT compile - V16 has no remote compile API)", inputSchema=PLC_CHECK_SCHEMA),
        Tool(name="blocks_batch_compile", description="[NOT SUPPORTED in V16] Always returns failure - use GUI Ctrl+F7 to compile", inputSchema=BATCH_COMPILE_SCHEMA),
        Tool(name="blocks_batch_copy", description="Batch copy blocks with new names", inputSchema=BATCH_COPY_SCHEMA),
        Tool(name="blocks_batch_delete", description="Batch delete multiple blocks", inputSchema=BATCH_DELETE_SCHEMA),
        Tool(name="block_delete", description="Delete a single block AND its external source", inputSchema=BLOCK_DELETE_SCHEMA),
        Tool(name="blocks_update_external_source", description="Delete old block/external source, create new from SCL file, generate block (V16)", inputSchema=BLOCKS_UPDATE_EXT_SRC_SCHEMA),
        Tool(name="blocks_recompile_all", description="Rebuild all blocks from SCL source files in a directory (auto-discovers .scl/.db files, sorts DB→FC→OB)", inputSchema=BLOCKS_RECOMPILE_ALL_SCHEMA),
        Tool(name="ladder_generate", description="[LIMITED in V16] Creates empty LAD block only - cannot populate networks. Use SCL for programmatic logic", inputSchema=LADDER_GENERATE_SCHEMA),
        Tool(name="ladder_validate", description="Validate ladder logic structure", inputSchema=LADDER_VALIDATE_SCHEMA),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        if name == "ping":
            return [TextContent(type="text", text="pong")]
        
        tia_error = _check_tia()
        if tia_error:
            return [TextContent(type="text", text=f"TIA Portal initialization failed: {tia_error}")]
        
        from . import project_manager
        from . import block_manager
        from . import variable_manager
        from . import device_manager
        from . import plc_checker
        from . import batch_processor
        from . import ladder_generator
        
        if name == "project_create":
            project_path = arguments.get("project_path")
            project_name = arguments.get("project_name")
            result = project_manager.project_create(project_path, project_name)
        elif name == "project_open":
            project_path = arguments.get("project_path")
            result = project_manager.project_open(project_path)
        elif name == "project_open_gui":
            project_path = arguments.get("project_path")
            mode = arguments.get("mode", "WithUserInterface")
            result = project_manager.project_open_gui(project_path, mode)
        elif name == "project_save":
            result = project_manager.project_save()
        elif name == "project_get_info":
            result = project_manager.project_get_info()
        elif name == "project_close":
            result = project_manager.project_close()
        elif name == "block_export":
            project_path = arguments.get("project_path")
            block_name = arguments.get("block_name")
            output_dir = arguments.get("output_dir")
            plc_name = arguments.get("plc_name")
            result = block_manager.block_export(project_path, block_name, output_dir, plc_name)
        elif name == "blocks_export_all":
            project_path = arguments.get("project_path")
            output_dir = arguments.get("output_dir")
            plc_name = arguments.get("plc_name")
            result = block_manager.blocks_export_all(project_path, output_dir, plc_name)
        elif name == "block_import":
            project_path = arguments.get("project_path")
            block_xml_path = arguments.get("block_xml_path")
            plc_name = arguments.get("plc_name")
            result = block_manager.block_import(project_path, block_xml_path, plc_name)
        elif name == "variable_table_get":
            project_path = arguments.get("project_path")
            plc_name = arguments.get("plc_name")
            result = variable_manager.variable_table_get(project_path, plc_name)
        elif name == "variable_add":
            project_path = arguments.get("project_path")
            var_name = arguments.get("var_name")
            data_type = arguments.get("data_type")
            address = arguments.get("address")
            plc_name = arguments.get("plc_name")
            result = variable_manager.variable_add(project_path, var_name, data_type, address, plc_name)
        elif name == "variable_modify":
            project_path = arguments.get("project_path")
            var_name = arguments.get("var_name")
            data_type = arguments.get("data_type")
            address = arguments.get("address")
            plc_name = arguments.get("plc_name")
            result = variable_manager.variable_modify(project_path, var_name, data_type, address, plc_name)
        elif name == "variable_delete":
            project_path = arguments.get("project_path")
            var_name = arguments.get("var_name")
            plc_name = arguments.get("plc_name")
            result = variable_manager.variable_delete(project_path, var_name, plc_name)
        elif name == "variables_export":
            project_path = arguments.get("project_path")
            output_path = arguments.get("output_path")
            format = arguments.get("format", "json")
            plc_name = arguments.get("plc_name")
            result = variable_manager.variables_export(project_path, output_path, format, plc_name)
        elif name == "device_scan":
            project_path = arguments.get("project_path")
            result = device_manager.device_scan(project_path)
        elif name == "device_get_structure":
            project_path = arguments.get("project_path")
            result = device_manager.device_get_structure(project_path)
        elif name == "device_get_properties":
            project_path = arguments.get("project_path")
            device_name = arguments.get("device_name")
            result = device_manager.device_get_properties(project_path, device_name)
        elif name == "plc_check":
            project_path = arguments.get("project_path")
            plc_name = arguments.get("plc_name")
            result = plc_checker.plc_check(project_path, plc_name)
        elif name == "blocks_batch_compile":
            project_path = arguments.get("project_path")
            block_names = arguments.get("block_names", [])
            plc_name = arguments.get("plc_name")
            result = batch_processor.blocks_batch_compile(project_path, block_names, plc_name)
        elif name == "blocks_batch_copy":
            project_path = arguments.get("project_path")
            block_mappings = arguments.get("block_mappings", [])
            plc_name = arguments.get("plc_name")
            result = batch_processor.blocks_batch_copy(project_path, block_mappings, plc_name)
        elif name == "blocks_batch_delete":
            project_path = arguments.get("project_path")
            block_names = arguments.get("block_names", [])
            plc_name = arguments.get("plc_name")
            result = batch_processor.blocks_batch_delete(project_path, block_names, plc_name)
        elif name == "block_delete":
            project_path = arguments.get("project_path")
            block_name = arguments.get("block_name")
            plc_name = arguments.get("plc_name")
            result = batch_processor.block_delete(project_path, block_name, plc_name)
        elif name == "blocks_update_external_source":
            project_path = arguments.get("project_path")
            block_name = arguments.get("block_name")
            scl_file_path = arguments.get("scl_file_path")
            plc_name = arguments.get("plc_name")
            result = block_manager.blocks_update_external_source(project_path, block_name, scl_file_path, plc_name)
        elif name == "blocks_recompile_all":
            project_path = arguments.get("project_path")
            scl_dir = arguments.get("scl_dir")
            plc_name = arguments.get("plc_name")
            build_order = arguments.get("build_order")
            result = block_manager.blocks_recompile_all(project_path, scl_dir, plc_name, build_order)
        elif name == "ladder_generate":
            project_path = arguments.get("project_path")
            block_name = arguments.get("block_name")
            networks = arguments.get("networks", [])
            plc_name = arguments.get("plc_name")
            result = ladder_generator.ladder_generate(project_path, block_name, networks, plc_name)
        elif name == "ladder_validate":
            ladder_logic = arguments.get("ladder_logic", {})
            result = ladder_generator.ladder_validate(ladder_logic)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
        
        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False))]
    except Exception as e:
        return [TextContent(type="text", text=json.dumps({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }, ensure_ascii=False))]

async def main():
    try:
        async with stdio_server() as (read_stream, write_stream):
            await app.run(read_stream, write_stream, app.create_initialization_options())
    finally:
        try:
            from ._common import close_tia, close_project, _kill_portal_processes
            close_project()
            close_tia()
            _kill_portal_processes()
        except Exception:
            pass

if __name__ == "__main__":
    asyncio.run(main())