"""
S3D建库数据生成器 - 配置文件 V3.0
内置模板字段定义，无需外部模板文件
"""

import os
import json

# =============================================================================
# 基础路径
# =============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

# 确保目录存在
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =============================================================================
# PipingCatalog模板字段定义（内置）
# =============================================================================
PIPING_CATALOG_TEMPLATES = {
    'PipeStock': {
        'PartClassType': 'PipeStockClass',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'MaterialGrade',
            'GeometricIndustryStandard', 'Density', 'GraphicalRepresentationOrNot',
            'PurchaseLength', 'MinimumPipeLength', 'MaximumPipeLength',
            'ManufacturingMethod', 'SurfacePreparation', 'LiningMaterial',
            'DryWeightForEnd1', 'DryWeightForEnd2',
            'EndPreparation[1]', 'PressureRating[1]', 'EndStandard[1]', 'ScheduleThickness[1]',
            'EndPreparation[2]', 'PressureRating[2]', 'EndStandard[2]', 'ScheduleThickness[2]',
            'Npd[1]:Primary', 'NpdUnitType[1]', 'Npd[2]:Secondary', 'NpdUnitType[2]',
            'WeightPerUnitLength', 'PipingNote1'
        ]
    },
    '90DegLRElbow': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': '90DegreeElbow,Ingr.SP3D.Content.Piping.Elbow90Degree',
        'UserClassName': '90 Degree Long Radius Elbow',
        'OccClassName': '90 Degree Long Radius Elbow',
        'SymbolIcon': 'SymbolIcons\\SP3D90Elbow.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendAngle', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoCenter'
        ]
    },
    '45DegElbow': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': '45DegreeElbow,Ingr.SP3D.Content.Piping.Elbow45Deg',
        'UserClassName': '45 Degree Elbow',
        'OccClassName': '45 Degree Elbow',
        'SymbolIcon': 'SymbolIcons\\SP3D45Elbow.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendAngle', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoCenter'
        ]
    },
    'Tee': {
        'PartClassType': 'PipeComponentClass',
        'UserClassName': 'Tee',
        'OccClassName': 'Tee',
        'SymbolIcon': 'SymbolIcons\\EqualTee.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingPointBasis[3]', 'Id[3]', 'PressureRating[3]', 'EndPreparation[3]',
            'EndStandard[3]', 'ScheduleThickness[3]', 'FlowDirection[3]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]:Primary', 'NpdUnitType[1]', 'Npd[2]:Primary', 'NpdUnitType[2]',
            'Npd[3]:Secondary', 'NpdUnitType[3]', 'FacetoCenter', 'Face1toCenter', 'Face3toCenter'
        ]
    },
    'ReducingTee': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Tee,Ingr.SP3D.Content.Piping.Tee',
        'UserClassName': 'Reducing Tee',
        'OccClassName': 'Reducing Tee',
        'SymbolIcon': 'SymbolIcons\\SP3DTeePDB860.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingPointBasis[3]', 'Id[3]', 'PressureRating[3]', 'EndPreparation[3]',
            'EndStandard[3]', 'ScheduleThickness[3]', 'FlowDirection[3]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]:Primary', 'NpdUnitType[1]', 'Npd[2]:Primary', 'NpdUnitType[2]',
            'Npd[3]:Secondary', 'NpdUnitType[3]', 'Face1toCenter', 'Face3toCenter'
        ]
    },
    'ConcentricReducer': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'ConcentricReducer,Ingr.SP3D.Content.Piping.Concentric',
        'UserClassName': 'Concentric Reducer',
        'OccClassName': 'Concentric Reducer',
        'SymbolIcon': 'SymbolIcons\\SP3DReducer.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoFace'
        ]
    },
    'EccentricReducer': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'EccentricReducer,Ingr.SP3D.Content.Piping.Eccentric',
        'UserClassName': 'Eccentric Reducer',
        'OccClassName': 'Eccentric Reducer',
        'SymbolIcon': 'SymbolIcons\\SP3DEccReducer.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoFace'
        ]
    },
    'WeldNeckFlange': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Flange,Ingr.SP3D.Content.Piping.Flange',
        'UserClassName': 'Weld Neck Flange',
        'OccClassName': 'Weld Neck Flange',
        'SymbolIcon': 'SymbolIcons\\SP3DFlangePDB15.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoFace'
        ]
    },
    'BlindFlange': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'BlindFlange,Ingr.SP3D.Content.Piping.BlindFlange',
        'UserClassName': 'Blind Flange',
        'OccClassName': 'Blind Flange',
        'SymbolIcon': 'SymbolIcons\\SP3DBlindFlange.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]'
        ]
    },
    'SocketweldFlange': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Flange,Ingr.SP3D.Content.Piping.Flange',
        'UserClassName': 'Socketweld Flange',
        'OccClassName': 'Socketweld Flange',
        'SymbolIcon': 'SymbolIcons\\SP3DFlangePDB15.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoFace'
        ]
    },
    'Cap': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Cap,Ingr.SP3D.Content.Piping.Cap',
        'UserClassName': 'Cap',
        'OccClassName': 'Cap',
        'SymbolIcon': 'SymbolIcons\\SP3DCap.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'FacetoEnd'
        ]
    },
    'Weldolet': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Weldolet,Ingr.SP3D.Content.Piping.Weldolet',
        'UserClassName': 'Weldolet',
        'OccClassName': 'Weldolet',
        'SymbolIcon': 'SymbolIcons\\WeldoletPDB3394.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]',
            'FacetoFittingCrotch', 'MajorBodyDia', 'HoleDia'
        ]
    },
    'BallValve': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'BallValve,Ingr.SP3D.Content.Piping.BallValve',
        'UserClassName': 'Ball Valve',
        'OccClassName': 'Ball Valve',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'SymbolIcon', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]',
            'FacetoFace', 'Face1toCenter', 'OffsetFrmValCen', 'Width', 'Height'
        ]
    },
    'GateValve': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'GateValve,Ingr.SP3D.Content.Piping.GateValve ',
        'UserClassName': 'Gate Valve',
        'OccClassName': 'Gate Valve',
        'SymbolIcon': 'SymbolIcons\\SP3DGateValvePDB2258.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'SymbolIcon', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]',
            'FacetoFace', 'OffsetFrmValCen', 'Diameter'
        ]
    },
    'CheckValve': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'CheckValve,Ingr.SP3D.Content.Piping.CheckValve',
        'UserClassName': 'Check Valve',
        'OccClassName': 'Check Valve',
        'SymbolIcon': 'SymbolIcons\\SP3DCheckValve.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'SymbolIcon', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]',
            'FacetoFace', 'HeightFrmValCen', 'EqualizerClearance', 'Diameter'
        ]
    },
    'Nipple': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Nipple,Ingr.SP3D.Content.Piping.Nipple',
        'UserClassName': 'Nipple',
        'OccClassName': 'Nipple',
        'SymbolIcon': 'SymbolIcons\\SP3DNipple.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'GeometricIndustryStandard', 'PartDataBasis', 'ManufacturingMethod',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoFace'
        ]
    },
    'Coupling': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'Coupling,Ingr.SP3D.Content.Piping.Coupling',
        'UserClassName': 'Coupling',
        'OccClassName': 'Coupling',
        'SymbolIcon': 'SymbolIcons\\SP3DCoupling.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]', 'FacetoFace'
        ]
    },
    'Lateral': {
        'PartClassType': 'PipeComponentClass',
        'UserClassName': 'Lateral',
        'OccClassName': 'Lateral',
        'SymbolIcon': 'SymbolIcons\\SP3DLateralRRB.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingPointBasis[3]', 'Id[3]', 'PressureRating[3]', 'EndPreparation[3]',
            'EndStandard[3]', 'ScheduleThickness[3]', 'FlowDirection[3]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]:Primary', 'NpdUnitType[1]', 'Npd[2]:Primary', 'NpdUnitType[2]',
            'Npd[3]:Secondary', 'NpdUnitType[3]', 'Face1toCenter', 'Face2toCenter', 'Face3toCenter'
        ]
    },
    'SpectacleBlind': {
        'PartClassType': 'PipeComponentClass',
        'SymbolDefinition': 'SpectacleBlind,Ingr.SP3D.Content.Piping.SpectacleBlind',
        'UserClassName': 'Spectacle Blind',
        'OccClassName': 'Spectacle Blind',
        'SymbolIcon': 'SymbolIcons\\SP3DSpectacleBlindPDB2432.gif',
        'fields': [
            'IndustryCommodityCode', 'CommodityType', 'GeometryType',
            'GraphicalRepresentationOrNot', 'SymbolDefinition', 'MaterialGrade',
            'LiningMaterial', 'BendRadius', 'BendRadiusMultiplier',
            'MirrorBehaviorOption', 'GeometricIndustryStandard', 'PartDataBasis',
            'ValveManufacturer', 'ValveModelNumber', 'ValveTrim',
            'FlangeFaceSurfaceFinish', 'SurfacePreparation', 'ManufacturingMethod',
            'MiscRequisitionClassification',
            'PipingPointBasis[1]', 'Id[1]', 'PressureRating[1]', 'EndPreparation[1]',
            'EndStandard[1]', 'ScheduleThickness[1]', 'FlowDirection[1]',
            'PipingPointBasis[2]', 'Id[2]', 'PressureRating[2]', 'EndPreparation[2]',
            'EndStandard[2]', 'ScheduleThickness[2]', 'FlowDirection[2]',
            'PipingNote1', 'DryWeight', 'DryCogX', 'DryCogY', 'DryCogZ',
            'WaterWeight', 'WaterCogX', 'WaterCogY', 'WaterCogZ',
            'SurfaceArea', 'VolumetricCapacity',
            'Npd[1]', 'NpdUnitType[1]', 'Npd[2]', 'NpdUnitType[2]',
            'FacetoFace', 'CentertoCenter', 'WebWidth', 'WebThickness'
        ]
    }
}

# =============================================================================
# SPC模板字段定义（内置）
# =============================================================================
SPC_TEMPLATES = {
    'PipingMaterialsClassData': {
        'fields': [
            'SpecName', 'MaterialsOfConstructionClass', 'MaterialsDescription',
            'FluidService', 'DesignStandard', 'AutomatedFlangeSelectionOption',
            'PipingCommodityOverrideOption', 'WasherCreationOption',
            'GasketRequirementOverride', 'LiningMaterial', 'PipingNote1',
            'PipingSpecStatus', 'Responsibility', 'LastModifiedOn', 'Comments',
            'RevisionNumber', 'ApprovedBy', 'ApprovalDate',
            'JacketMatOfConstructionClass', 'JumperMatOfConstructionClass',
            'JacketMaterialsDescription', 'JumperMaterialsDescription',
            'JacketAndJumperFluidService', 'StressRelief', 'Examination',
            'HyperlinkToHumanSpec', 'StressReliefRequirement', 'MaterialsGroup',
            'WeldingProcedureSpecification', 'MaterialsType'
        ]
    },
    'PipingCommodityFilter': {
        'fields': [
            'SpecName', 'ShortCode', 'OptionCode', 'FirstSizeFrom', 'FirstSizeTo',
            'FirstSizeUnits', 'SecondSizeFrom', 'SecondSizeTo', 'SecondSizeUnits',
            'MultisizeOption', 'Comments', 'SelectionBasis', 'FluidCode',
            'JacketedPipingBasis', 'MaximumTemperature', 'MinimumTemperature',
            'EngineeringTag', 'CommodityCode', 'FabricationCategoryOverride',
            'SupplyResponsibilityOverride', 'FirstSizeSchedule', 'SecondSizeSchedule',
            'ReportableCommodityCode', 'QuantityOfReportableParts',
            'AssociatedCommodityCode', 'BendRadiusMultiplier', 'BendRadius',
            'NumberOfMiterCuts', 'FirstSizeUOMBasisInCatalog',
            'SecondSizeUOMBasisInCatalog', 'PDSModifier', 'PreferredPipeLength',
            'PipingNote1', 'AltReportableCommodityCode', 'QuantityOfAltReportableParts'
        ]
    },
    'PipingCommodityMatlControlData': {
        'fields': [
            'ContractorCommodityCode', 'FirstSizeFrom', 'FirstSizeTo', 'FirstSizeUnits',
            'SecondSizeFrom', 'SecondSizeTo', 'SecondSizeUnits', 'MultisizeOption',
            'IndustryCommodityCode', 'ClientCommodityCode', 'CIMISCommodityCode',
            'ShortMaterialDescription', 'LocalizedShortMaterialDesc',
            'LongMaterialDescription', 'Vendor', 'Manufacturer', 'FabricationType',
            'SupplyResponsibility', 'ReportingType', 'QuantityOfReportableParts',
            'GasketRequirements', 'BoltingRequirements', 'ClampRequirement',
            'WeldingRequirement', 'LooseMaterialRequirements',
            'SubstCapScrewsQuantity', 'SubstCapScrewCntrCommodityCode',
            'SubstCapScrewDiameter', 'TappedHoleDepth', 'TappedHoleDepth2',
            'CapScrewEngagementGap', 'MultiportValveOpReq', 'ValveOperatorType',
            'ValveOperatorGeoIndStd', 'ValveOperatorCatalogPartNumber',
            'ReportableCommodityCode', 'PartDataSource', 'AltOrientationCommodityCode',
            'HyperlinkToElectronicVendor', 'HyperlinkToElectronicManuals',
            'PipingNote1', 'VendorPartNumber', 'ManufacturerPartNumber',
            'AltReportableCommodityCode', 'QuantityOfAltReportableParts',
            'eClasseProcurementCode', 'UNSPSCeProcurementCode', 'LegacyCommodityCode'
        ]
    },
    'PipeBranch': {
        'fields': [
            'SpecName', 'HeaderSize', 'BranchSize', 'AngleLow', 'AngleHigh',
            'HdrSizeNPDUnitType', 'BrSizeNPDUnitType', 'ShortCode',
            'SecondaryShortCode', 'TertiaryShortCode'
        ]
    },
    'PipeNominalDiameters': {
        'fields': ['SpecName', 'Npd', 'NpdUnitType']
    },
    'BendAngles': {
        'fields': ['SpecName', 'Npd', 'NpdUnitType', 'BendAngle']
    }
}

# =============================================================================
# 零件类型映射
# =============================================================================
PART_TYPE_MAPPING = {
    'PIPE': {'sheet_name': 'PipeStock', 'commodity_type': 'PIPE', 'geometry_type': 5, 'category': '管材'},
    'NIPPLE': {'sheet_name': 'Nipple', 'commodity_type': 'NIP', 'geometry_type': 15, 'category': '管材'},
    'CON SWAGED NIPPLE': {'sheet_name': 'ConcentricSwage', 'commodity_type': 'OSG', 'geometry_type': 16, 'category': '管件'},
    'COUPLING': {'sheet_name': 'Coupling', 'commodity_type': 'CPL', 'geometry_type': 15, 'category': '管件'},
    '45 DEG ELBOW': {'sheet_name': '45DegElbow', 'commodity_type': 'E45', 'geometry_type': 20, 'category': '弯头'},
    '45 DEG LR ELBOW': {'sheet_name': '45DegElbow', 'commodity_type': 'E45LR', 'geometry_type': 20, 'category': '弯头'},
    '90 DEG ELBOW': {'sheet_name': '90DegLRElbow', 'commodity_type': 'E90', 'geometry_type': 20, 'category': '弯头'},
    '90 DEG LR ELBOW': {'sheet_name': '90DegLRElbow', 'commodity_type': 'E90LR', 'geometry_type': 20, 'category': '弯头'},
    '90 DEG SR ELBOW': {'sheet_name': '90DegSRElbow', 'commodity_type': 'E90SR', 'geometry_type': 20, 'category': '弯头'},
    'CON REDUCER': {'sheet_name': 'ConcentricReducer', 'commodity_type': 'RC', 'geometry_type': 16, 'category': '异径'},
    'ECC REDUCER': {'sheet_name': 'EccentricReducer', 'commodity_type': 'RE', 'geometry_type': 65, 'category': '异径'},
    'EQUAL TEE': {'sheet_name': 'Tee', 'commodity_type': 'TE', 'geometry_type': 75, 'category': '三通'},
    'RED TEE': {'sheet_name': 'ReducingTee', 'commodity_type': 'TR', 'geometry_type': 80, 'category': '三通'},
    'CAP': {'sheet_name': 'Cap', 'commodity_type': 'CAP', 'geometry_type': 220, 'category': '管帽'},
    'WELDOLET': {'sheet_name': 'Weldolet', 'commodity_type': 'WEL', 'geometry_type': 15, 'category': '管座'},
    'WN FLANGE': {'sheet_name': 'WeldNeckFlange', 'commodity_type': 'FWN', 'geometry_type': 15, 'category': '法兰'},
    'SW FLANGE': {'sheet_name': 'SocketweldFlange', 'commodity_type': 'FSW', 'geometry_type': 15, 'category': '法兰'},
    'BLIND FLANGE': {'sheet_name': 'BlindFlange', 'commodity_type': 'FBL', 'geometry_type': 220, 'category': '法兰'},
    'FIGURE-8 BLANK': {'sheet_name': 'SpectacleBlind', 'commodity_type': 'BLSPO', 'geometry_type': 15, 'category': '法兰'},
    'GATE VALVE': {'sheet_name': 'GateValve', 'commodity_type': 'GAT', 'geometry_type': 5, 'category': '阀门'},
    'CHECK VALVE': {'sheet_name': 'CheckValve', 'commodity_type': 'CK', 'geometry_type': 5, 'category': '阀门'},
    'BALL VALVE': {'sheet_name': 'BallValve', 'commodity_type': 'BALL', 'geometry_type': 5, 'category': '阀门'},
}

# =============================================================================
# 代码映射
# =============================================================================
END_PREPARATION_MAPPING = {'PE': 300, 'BE': 301, 'BW': 301, 'RF': 21, 'FF': 11, 'RTJ': 23, 'SW': 401, 'NPT': 331, 'MNPT': 331, 'FNPT': 331}
END_STANDARD_MAPPING = {'SH/T 3405': 4501, 'SH/T 3406': 4501, 'SH/T 3408': 4701, 'SH/T 3410': 4501, 'GB/T 8163': 70005, 'GB/T 3274': 70005, 'SY/T 5037': 70030, 'NB/T 47008': 70005}
MATERIAL_GRADE_MAPPING = {'20 GB/T 8163': 162, 'GB/T 8163 20': 162, 'A105': 150, 'A216 WCB': 151, 'CF415K': 152, 'Q245R': 153, 'Q235B': 153, '304': 200, '316L': 200, '13Cr': 400, 'STL': 400, 'CS': 162}
PRESSURE_RATING_MAPPING = {'CL150': 35, 'CL300': 60, 'CL600': 70, 'CL900': 85, 'CL1500': 95, 'CL3000': 110}
SCHEDULE_MAPPING = {'Sch40': 'S-40', 'Sch40S': 'S-40S', 'Sch80': 'S-80', 'Sch80S': 'S-80S', 'SchXS': 'S-XS', 'SchSTD': 'S-STD', 'SchXXS': 'S-XXS'}
FABRICATION_TYPE_MAPPING = {'PipeStock': 15, 'Nipple': 15, 'Coupling': 15, 'ConcentricReducer': 15, 'EccentricReducer': 15, 'Tee': 15, 'ReducingTee': 15, 'Cap': 15, 'Weldolet': 15, 'WeldNeckFlange': 20, 'BlindFlange': 20, 'SpectacleBlind': 20, 'GateValve': 35, 'CheckValve': 35, 'BallValve': 35}
VALVE_OPERATOR_MAPPING = {'GateValve': 3, 'CheckValve': 3, 'BallValve': 9}
DEFAULT_VALUES = {'SupplyResponsibility': 2, 'ReportingType': 5, 'QuantityOfReportableParts': 1, 'GasketRequirements': 20, 'BoltingRequirements': 35, 'WeldingRequirement': 5, 'BendRadiusMultiplier': 1.5, 'AngleLow': 44.5, 'AngleHigh': 45.5}

# =============================================================================
# 输出文件名配置
# =============================================================================
OUTPUT_FILES = {'piping_catalog': '24019_PipingCatalog.xls', 'spc': '240194_SPC.xls'}

# =============================================================================
# NPS/DN 转换表
# =============================================================================
NPS_TO_DN = {
    0.125: 6, 0.25: 8, 0.375: 10, 0.5: 15, 0.75: 20, 1.0: 25,
    1.25: 32, 1.5: 40, 2.0: 50, 2.5: 65, 3.0: 80, 3.5: 90,
    4.0: 100, 5.0: 125, 6.0: 150, 8.0: 200, 10.0: 250, 12.0: 300,
    14.0: 350, 16.0: 400, 18.0: 450, 20.0: 500, 22.0: 550, 24.0: 600
}

DN_TO_NPS = {v: k for k, v in NPS_TO_DN.items()}

# =============================================================================
# 商品编码前缀
# =============================================================================
COMMODITY_CODE_PREFIX = {
    'PIPE': 'PIP', 'NIP': 'NIP', 'OSG': 'OSG', 'CPL': 'CPL',
    'E45': 'E45', 'E45LR': 'E45LR', 'E90': 'E90', 'E90LR': 'E90LR', 'E90SR': 'E90SR',
    'RC': 'RC', 'RE': 'RE', 'TE': 'TE', 'TR': 'TR',
    'CAP': 'CAP', 'WEL': 'WEL', 'FWN': 'FWN', 'FSW': 'FSW', 'FBL': 'FBL',
    'BLSPO': 'BLSPO', 'GAT': 'GAT', 'CK': 'CK', 'BALL': 'BALL'
}
