#!/usr/bin/env python3
"""
园林设计意图预测后端服务
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# 模拟模型预测（实际部署时替换为真实模型）
class GardenDesignPredictor:
    def __init__(self):
        self.models = {
            'model_75w': {'accuracy': 0.85, 'name': '75W点模型'},
            'model_500w': {'accuracy': 0.92, 'name': '500W点模型'}
        }
    
    def predict(self, model_id, element_id, position_change):
        """
        预测设计效果评分
        :param model_id: 模型ID
        :param element_id: 元素ID
        :param position_change: 位置变化百分比
        :return: 预测结果
        """
        model = self.models[model_id]
        factor = model['accuracy'] / 0.85
        change = position_change
        
        # 基于元素类型计算评分
        if element_id == 'rock1':
            layer_score = (85 + change * 0.3) * factor
            space_score = (78 - change * 0.2) * factor
            if change == 0:
                analysis = '当前假山A位置处于最佳位置，层次感和空间感达到平衡。'
            elif change > 0:
                analysis = '假山A右移后，层次感增强，但空间通透度有所下降。建议结合实际景观需求调整。'
            else:
                analysis = '假山A左移后，空间通透度提升，但层次感有所减弱。建议在入口处设置对景元素。'
        
        elif element_id == 'rock2':
            layer_score = (80 + change * 0.25) * factor
            space_score = (75 + change * 0.15) * factor
            if change == 0:
                analysis = '假山B与假山A形成良好的呼应关系，建议保持当前位置。'
            elif change > 0:
                analysis = '假山B右移后，与主假山的呼应关系减弱，建议调整角度保持对景效果。'
            else:
                analysis = '假山B左移后，与主假山的距离缩短，层次感增强，但需注意空间通透度。'
        
        elif element_id == 'pillar':
            layer_score = (88 - abs(change) * 0.2) * factor
            space_score = (70 + change * 0.3) * factor
            if change == 0:
                analysis = '观景柱位于最佳框景位置，可有效框定水池和古树。'
            else:
                analysis = '观景柱移动后，框景效果发生变化。建议调整位置以获得最佳框景角度。'
        
        elif element_id == 'water':
            layer_score = (82 + change * 0.1) * factor
            space_score = (85 - abs(change) * 0.15) * factor
            if change == 0:
                analysis = '水池位置适中，倒影效果最佳，体现"疏水若为无尽"的理水原则。'
            else:
                analysis = '水池位置调整后，倒影范围变化。建议保持中心位置以获得最佳倒影效果。'
        
        elif element_id == 'tree':
            layer_score = (90 - abs(change) * 0.1) * factor
            space_score = (72 + change * 0.2) * factor
            if change == 0:
                analysis = '古树位置最佳，与观景亭形成借景关系，增添自然意趣。'
            elif change > 0:
                analysis = '古树右移后，与观景亭的借景关系减弱，建议保持原位。'
            else:
                analysis = '古树左移后，可增强与观景亭的视线联系，但需注意与其他元素的协调。'
        
        else:
            layer_score = 80 * factor
            space_score = 75 * factor
            analysis = '元素分析完成。'
        
        overall_score = round((layer_score + space_score) / 2)
        
        return {
            'model_name': model['name'],
            'model_accuracy': model['accuracy'],
            'element_id': element_id,
            'position_change': change,
            'layer_score': round(layer_score),
            'space_score': round(space_score),
            'overall_score': overall_score,
            'layer_change': round(change * 0.3 * factor) if change != 0 else 0,
            'space_change': round(-change * 0.2 * factor) if change != 0 else 0,
            'overall_change': overall_score - 82,
            'analysis': analysis
        }

predictor = GardenDesignPredictor()

@app.route('/api/models', methods=['GET'])
def get_models():
    """获取可用模型列表"""
    return jsonify({
        'models': [
            {'id': 'model_75w', 'name': '75W点模型', 'accuracy': '85%', 'dataset': '75W点'},
            {'id': 'model_500w', 'name': '500W点模型', 'accuracy': '92%', 'dataset': '500W点'}
        ]
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """预测设计效果"""
    data = request.json
    model_id = data.get('model_id', 'model_75w')
    element_id = data.get('element_id', 'rock1')
    position_change = data.get('position_change', 0)
    
    result = predictor.predict(model_id, element_id, position_change)
    return jsonify(result)

@app.route('/api/elements', methods=['GET'])
def get_elements():
    """获取园林元素列表"""
    elements = [
        {'id': 'rock1', 'name': '假山A', 'type': '山石', 'position': {'x': 15, 'y': 45}},
        {'id': 'rock2', 'name': '假山B', 'type': '山石', 'position': {'x': 35, 'y': 60}},
        {'id': 'pillar', 'name': '观景柱', 'type': '建筑构件', 'position': {'x': 55, 'y': 35}},
        {'id': 'water', 'name': '水池', 'type': '水体', 'position': {'x': 70, 'y': 55}},
        {'id': 'tree', 'name': '古树', 'type': '植物', 'position': {'x': 85, 'y': 30}},
        {'id': 'building', 'name': '观景亭', 'type': '建筑', 'position': {'x': 10, 'y': 20}}
    ]
    return jsonify({'elements': elements})

@app.route('/api/principles', methods=['GET'])
def get_principles():
    """获取设计原则列表"""
    principles = [
        {
            'id': 'borrowed',
            'name': '借景',
            'description': '借景原则：利用外部景观增强空间层次',
            'detail': '借景是中国园林造景手法之一，通过巧妙布局，将园外的景色引入园内视野，扩展空间意境。'
        },
        {
            'id': 'framed',
            'name': '框景',
            'description': '框景原则：通过门框、窗框等形成画面',
            'detail': '框景是利用建筑的门窗、柱廊等作为画框，将远处的景物框入其中，形成一幅天然的图画。'
        },
        {
            'id': 'opposite',
            'name': '对景',
            'description': '对景原则：在轴线两端设置相互对应的景观',
            'detail': '对景是在园林空间的轴线两端设置相互对应的景物，使观赏者在行进过程中能够看到对面的景色。'
        },
        {
            'id': 'sequence',
            'name': '序列',
            'description': '序列原则：空间组织应形成有节奏的序列',
            'detail': '序列是指园林空间的组织应具有节奏感，通过空间的开合、明暗、大小等变化，引导游览者的行进路线。'
        }
    ]
    return jsonify({'principles': principles})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)