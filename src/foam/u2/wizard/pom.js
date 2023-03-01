/**
 * @license
 * Copyright 2022 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.POM({
  name: "foam-u2-wizard",
  version: 1,
  files: [
    { name: "ContextPredicate",                        flags: "web" },
    { name: "WizardType",                              flags: "web" },
    { name: "crunch/CapabilityRefinement",             flags: "web" },
    { name: "crunch/GroupRefinement",                  flags: "js|java" },
    { name: "agents/ConfigureFlowAgent",               flags: "web" },
    { name: "agents/DeveloperModeAgent",               flags: "web" },
    { name: "agents/RootCapabilityAgent",              flags: "web" },
    { name: "agents/LoadScenarioAgent",                flags: "web" },
    { name: "agents/StepWizardAgent",                  flags: "web" },
    { name: "agents/ElementStepWizardAgent",           flags: "web" },
    { name: "agents/CreateControllerAgent",            flags: "web" },
    { name: "agents/SpinnerAgent",                     flags: "web" },
    { name: "agents/ValueAgent",                       flags: "web" },
    { name: "agents/DetachAgent",                      flags: "web" },
    { name: "agents/WizardletsAgent",                  flags: "web" },
    { name: "agents/AlternateFlowAgent",               flags: "web" },
    { name: "agents/AnalyticEventsAgent",              flags: "web" },
    { name: "agents/NullEventHandlerAgent",            flags: "web" },
    { name: "agents/QuickAgent",                       flags: "web" },
    { name: "analytics/AnalyticsEventHandlerAgent",    flags: "web" },
    { name: "analytics/WizardEventRefinement",         flags: "web" },
    { name: "internal/PropertyUpdate",                 flags: "web" },
    { name: "internal/FObjectRecursionSlot",           flags: "web" },
    { name: "internal/WizardletAutoSaveSlot",          flags: "web" },
    { name: "internal/lib",                            flags: "web" },
    { name: "debug/WizardEvent",                       flags: "web" },
    { name: "debug/DebugWAO",                          flags: "web" },
    { name: "debug/DebugContextIntercept",             flags: "web" },
    { name: "debug/DebugWizardletView",                flags: "web" },
    { name: "debug/TestWizard",                        flags: "java|web&debug" },
    { name: "debug/TestWizardScenario",                flags: "web&debug" },
    { name: "debug/scenarios",                         flags: "web&debug" },
    { name: "controllers/WizardController",            flags: "web" },
    { name: "controllers/IncrementalWizardController", flags: "web" },
    { name: "views/FlexibleWizardContentsView",        flags: "web" },
    { name: "views/FocusWizardView",                   flags: "web" },
    { name: "views/TipActionView",                     flags: "web" },
    { name: "SkipMeView",                              flags: "web" },
    { name: "PathProperty",                            flags: "web" },
    { name: "debug/WizardInspector",                   flags: "web" },
    { name: "WizardPosition",                          flags: "js|java" },
    { name: "AlternateFlow",                           flags: "web" },
    { name: "analytics/AlternateFlowRefinement",       flags: "js|java" },
    { name: "axiom/WizardAction",                      flags: "web" },
    { name: "axiom/NullWizardAction",                  flags: "web" },
    { name: "axiom/AlternateFlowAction",               flags: "web" },
    { name: "WizardStatus",                            flags: "web" },
    { name: "WizardletIndicator",                      flags: "js|java" },
    { name: "DynamicActionWizardlet",                  flags: "js|java" },
    { name: "WizardletAware",                          flags: "js|java" },
    { name: "WizardletView",                           flags: "web" },
    { name: "StepWizardConfig",                        flags: "js|java" },
    { name: "StepWizardletStepsView",                  flags: "web" },
    { name: "IncrementalStepWizardView",               flags: "web" },
    { name: "WizardletSearchController",               flags: "web" },
    { name: "ScrollingStepWizardView",                 flags: "web" },
    { name: "ScrollWizardletView",                     flags: "web" },
    { name: "FObjectHolder",                           flags: "web|java" },
    { name: "PrereqPropertySpec",                      flags: "web" },
    { name: "data/Loader",                             flags: "web" },
    { name: "data/Saver",                              flags: "web" },
    { name: "data/Canceler",                           flags: "web" },
    { name: "data/lib",                                flags: "web" },
    { name: "data/DAOSaver",                           flags: "web" },
    { name: "data/CapableSaver",                       flags: "web" },
    { name: "data/ExecuteActionsSaver",                flags: "web" },
    { name: "data/AlternateFlowSaver",                 flags: "web" },
    { name: "data/AnalyticsSaver",                     flags: "web" },
    { name: "data/ErrorSaver",                         flags: "web" },
    { name: "data/ArrayWrapSaver",                     flags: "web" },
    { name: "data/WrapSaver",                          flags: "web" },
    { name: "data/PrerequisiteLoader",                 flags: "web" },
    { name: "data/EasyLoader",                         flags: "web" },
    { name: "data/CreateLoader",                       flags: "web" },
    { name: "data/DAOArrayLoader",                     flags: "web" },
    { name: "data/ContextLoader",                      flags: "web" },
    { name: "data/PurgeCacheSaver",                    flags: "web" },
    { name: "data/PutLoader",                          flags: "web" },
    { name: "data/PayloadLoader",                      flags: "web" },
    { name: "data/PayloadSaver",                       flags: "web" },
    { name: "data/CopyPayloadsLoader",                 flags: "web" },
    { name: "data/FacadeWizardletSaver",               flags: "web" },
    { name: "data/InlineInterceptSaver",               flags: "web" },
    { name: "data/InlineTransientSaver",               flags: "web" },
    { name: "data/LoaderInjectorSaver",                flags: "web" },
    { name: "data/UserCapabilityJunctionSaver",        flags: "web" },
    { name: "data/UserLoader",                         flags: "web" },
    { name: "data/UserCapabilityJunctionLoader",       flags: "web" },
    { name: "data/EasySaver",                          flags: "web" },
    { name: "data/MapLoader",                          flags: "web" },
    { name: "data/WizardletChainLoader",               flags: "web" },
    { name: "data/HideIfValidSaver",                   flags: "web" },
    { name: "data/PredicatedSaver",                    flags: "web" },
    { name: "event/WizardEvent",                       flags: "web" },
    { name: "event/WizardEventType",                   flags: "web" },
    { name: "event/WizardErrorHint",                   flags: "web" },
    { name: "wao/WAO",                                 flags: "web" },
    { name: "wao/SplitWAO",                            flags: "web" },
    { name: "wao/DAOWAO",                              flags: "web" },
    { name: "wao/ProxyWAO",                            flags: "web" },
    { name: "wao/TopicWAO",                            flags: "web" },
    { name: "wao/NullWAO",                             flags: "web" },
    { name: "wao/XORMinMaxWAO",                        flags: "web" },
    { name: "wao/PrerequisiteWAO",                     flags: "web" },
    { name: "wao/CompositeWAO",                        flags: "web" },
    { name: "wao/ArrayFromPrerequisiteWAO",            flags: "web" },
    { name: "wao/AlternateFlowWAO",                    flags: "web" },
    { name: "wizardlet/Wizardlet",                     flags: "js|java" },
    { name: "wizardlet/BaseWizardlet",                 flags: "js|java" },
    { name: "wizardlet/ValidationFeedbackWizardlet",   flags: "js|java" },
    { name: "wizardlet/WizardletSection",              flags: "web" },
    { name: "wizardlet/SuccessWizardlet",              flags: "web" },
    { name: "wizardlet/SuccessWizardletView",          flags: "web" },
    { name: "wizardlet/ReviewWizardletView",           flags: "web" },
    { name: "wizardlet/ReviewItem",                    flags: "web" },
    { name: "wizardlet/ReviewWizardlet",               flags: "web" },
    { name: "wizardlet/AlternateFlowWizardlet",        flags: "web" },
    { name: "wizardlet/FallbackFlowWizardlet",         flags: "web" },
    { name: "wizardlet/SubmitWizardlet",               flags: "web" },
    { name: "wizardlet/FlowAgentWizardlet",            flags: "web" },
    { name: "wizardlet/DAOWizardlet",                  flags: "web" },
    { name: "wizardlet/FacadeCapabilityWizardlet",     flags: "web" },
    { name: "wizardlet/FacadeWizardletSpec",           flags: "web" },
    { name: "wizardflow/AddCapabilityHierarchy",       flags: "web" },
    { name: "wizardflow/WizardFlow",                   flags: "web" },
    { name: "wizardflow/Export",                       flags: "web" },
    { name: "wizardflow/WizardDSL",                    flags: "web" },
    { name: "wizardflow/SubDSL",                       flags: "web" },
    { name: "wizardflow/AddWizardlet",                flags: "web" },
    { name: "wizardflow/EditWizardlet",                flags: "web" },
    { name: "wizardflow/Predicated",                   flags: "web" },
  ]
});
