package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── ActionInjector ───

type ActionInjector struct {
	ctx *InjectorContext
}

func NewActionInjector(ctx *InjectorContext) *ActionInjector {
	return &ActionInjector{ctx: ctx}
}

func (ai *ActionInjector) APIName() string { return "action" }

func (ai *ActionInjector) Inject() error {
	if !ai.ctx.manifest.HasPermission("action.register") {
		return nil
	}

	actionAPI := map[string]interface{}{
		"register": ai.createRegister(),
	}

	ai.ctx.mergeIntoYara("action", actionAPI)
	return nil
}

func (ai *ActionInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(ai.ctx.sandbox.Runtime().NewTypeError("action.register(name, definition, handler) requires at least 2 arguments"))
		}
		actionName := call.Arguments[0].String()
		if actionName == "" {
			panic(ai.ctx.sandbox.Runtime().NewTypeError("action.register: action name cannot be empty"))
		}
		defRaw := call.Arguments[1].Export()
		defMap, ok := defRaw.(map[string]interface{})
		if !ok {
			panic(ai.ctx.sandbox.Runtime().NewTypeError("action.register: definition must be an object"))
		}

		var handler goja.Callable
		if len(call.Arguments) >= 3 {
			handler, _ = goja.AssertFunction(call.Arguments[2])
		}

		description := ""
		if d, exists := defMap["description"]; exists {
			description = fmt.Sprintf("%v", d)
		}
		briefDescription := ""
		if d, exists := defMap["briefDescription"]; exists {
			briefDescription = fmt.Sprintf("%v", d)
		}
		detailedDescription := ""
		if d, exists := defMap["detailedDescription"]; exists {
			detailedDescription = fmt.Sprintf("%v", d)
		}

		activationType := "always"
		if at, exists := defMap["activation_type"]; exists {
			activationType = fmt.Sprintf("%v", at)
		}

		var activationKeywords []string
		if akRaw, exists := defMap["activation_keywords"]; exists {
			if akList, ok := akRaw.([]interface{}); ok {
				for _, ak := range akList {
					activationKeywords = append(activationKeywords, fmt.Sprintf("%v", ak))
				}
			}
		}

		var activationProbability float64
		if apRaw, exists := defMap["activation_probability"]; exists {
			if ap, ok := apRaw.(float64); ok {
				activationProbability = ap
			}
		}

		parallelAction := false
		if pa, exists := defMap["parallel_action"]; exists {
			if b, ok := pa.(bool); ok {
				parallelAction = b
			}
		}

		actionParameters := make(map[string]string)
		if apRaw, exists := defMap["action_parameters"]; exists {
			if apMap, ok := apRaw.(map[string]interface{}); ok {
				for k, v := range apMap {
					actionParameters[k] = fmt.Sprintf("%v", v)
				}
			}
		}

		var actionRequirements []string
		if arRaw, exists := defMap["action_requirements"]; exists {
			if arList, ok := arRaw.([]interface{}); ok {
				for _, ar := range arList {
					actionRequirements = append(actionRequirements, fmt.Sprintf("%v", ar))
				}
			}
		}

		var parameters []ActionParamDef
		if paramsRaw, exists := defMap["parameters"]; exists {
			if paramsList, ok := paramsRaw.([]interface{}); ok {
				for _, p := range paramsList {
					if pMap, ok := p.(map[string]interface{}); ok {
						required := false
						if req, exists := pMap["required"]; exists {
							if b, ok := req.(bool); ok {
								required = b
							}
						}
						paramDef := ActionParamDef{
							Name:        fmt.Sprintf("%v", pMap["name"]),
							Type:        fmt.Sprintf("%v", pMap["type"]),
							Description: fmt.Sprintf("%v", pMap["description"]),
							Required:    required,
						}
						if def, exists := pMap["default"]; exists {
							paramDef.Default = def
						}
						if enumVals, exists := pMap["enumValues"]; exists {
							if ev, ok := enumVals.([]interface{}); ok {
								for _, e := range ev {
									paramDef.EnumValues = append(paramDef.EnumValues, fmt.Sprintf("%v", e))
								}
							}
						}
						parameters = append(parameters, paramDef)
					}
				}
			}
		}

		definition := ActionDef{
			Name:                  actionName,
			Description:           description,
			BriefDescription:      briefDescription,
			DetailedDescription:   detailedDescription,
			ActionParameters:      actionParameters,
			ActionRequirements:    actionRequirements,
			ActivationType:        activationType,
			ActivationKeywords:    activationKeywords,
			ActivationProbability: activationProbability,
			ParallelAction:        parallelAction,
			Parameters:            parameters,
		}

		id := ai.ctx.pluginID + "." + actionName
		ai.ctx.callbacks[id] = handler

		ai.ctx.mu.Lock()
		ai.ctx.actionDefinitions = append(ai.ctx.actionDefinitions, actionDefEntry{
			Name:       actionName,
			Definition: definition,
		})
		ai.ctx.mu.Unlock()

		logger.Sugar.Infow("[Plugin] registered action", "id", ai.ctx.pluginID, "action", actionName)
		return goja.Undefined()
	}
}
