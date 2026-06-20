export interface VibexCannedPairDefinition {
  readonly id: string;
  readonly promptKey: string;
  readonly responseKey: string;
}

export interface VibexCodeFragmentDefinition {
  readonly id: string;
  readonly lineKeys: readonly string[];
}

export interface VibexFileDefinition {
  readonly id: string;
  readonly labelKey: string;
  readonly fragments: readonly VibexCodeFragmentDefinition[];
}

export const VIBEX_CANNED_PAIRS: readonly VibexCannedPairDefinition[] = [
  {
    id: "regex-exorcism",
    promptKey: "vibex.canned.regexExorcism.prompt",
    responseKey: "vibex.canned.regexExorcism.response"
  },
  {
    id: "standup-haiku",
    promptKey: "vibex.canned.standupHaiku.prompt",
    responseKey: "vibex.canned.standupHaiku.response"
  },
  {
    id: "senior-button",
    promptKey: "vibex.canned.seniorButton.prompt",
    responseKey: "vibex.canned.seniorButton.response"
  },
  {
    id: "yaml-therapy",
    promptKey: "vibex.canned.yamlTherapy.prompt",
    responseKey: "vibex.canned.yamlTherapy.response"
  },
  {
    id: "roadmap-vision",
    promptKey: "vibex.canned.roadmapVision.prompt",
    responseKey: "vibex.canned.roadmapVision.response"
  },
  {
    id: "founder-demo",
    promptKey: "vibex.canned.founderDemo.prompt",
    responseKey: "vibex.canned.founderDemo.response"
  },
  {
    id: "prompt-archaeology",
    promptKey: "vibex.canned.promptArchaeology.prompt",
    responseKey: "vibex.canned.promptArchaeology.response"
  },
  {
    id: "cache-invalidation",
    promptKey: "vibex.canned.cacheInvalidation.prompt",
    responseKey: "vibex.canned.cacheInvalidation.response"
  }
] as const;

export const VIBEX_CODE_FILES: readonly VibexFileDefinition[] = [
  {
    id: "app-main",
    labelKey: "vibex.file.appMain",
    fragments: [
      {
        id: "boot",
        lineKeys: [
          "vibex.code.appMain.boot.0",
          "vibex.code.appMain.boot.1",
          "vibex.code.appMain.boot.2",
          "vibex.code.appMain.boot.3"
        ]
      },
      {
        id: "route",
        lineKeys: [
          "vibex.code.appMain.route.0",
          "vibex.code.appMain.route.1",
          "vibex.code.appMain.route.2",
          "vibex.code.appMain.route.3"
        ]
      }
    ]
  },
  {
    id: "core-loop",
    labelKey: "vibex.file.coreLoop",
    fragments: [
      {
        id: "tick",
        lineKeys: [
          "vibex.code.coreLoop.tick.0",
          "vibex.code.coreLoop.tick.1",
          "vibex.code.coreLoop.tick.2",
          "vibex.code.coreLoop.tick.3"
        ]
      },
      {
        id: "dirty",
        lineKeys: [
          "vibex.code.coreLoop.dirty.0",
          "vibex.code.coreLoop.dirty.1",
          "vibex.code.coreLoop.dirty.2",
          "vibex.code.coreLoop.dirty.3"
        ]
      }
    ]
  },
  {
    id: "systems-agents",
    labelKey: "vibex.file.systemsAgents",
    fragments: [
      {
        id: "hire",
        lineKeys: [
          "vibex.code.systemsAgents.hire.0",
          "vibex.code.systemsAgents.hire.1",
          "vibex.code.systemsAgents.hire.2",
          "vibex.code.systemsAgents.hire.3"
        ]
      },
      {
        id: "compute",
        lineKeys: [
          "vibex.code.systemsAgents.compute.0",
          "vibex.code.systemsAgents.compute.1",
          "vibex.code.systemsAgents.compute.2",
          "vibex.code.systemsAgents.compute.3"
        ]
      }
    ]
  },
  {
    id: "ui-terminal",
    labelKey: "vibex.file.uiTerminal",
    fragments: [
      {
        id: "flow",
        lineKeys: [
          "vibex.code.uiTerminal.flow.0",
          "vibex.code.uiTerminal.flow.1",
          "vibex.code.uiTerminal.flow.2",
          "vibex.code.uiTerminal.flow.3"
        ]
      },
      {
        id: "snark",
        lineKeys: [
          "vibex.code.uiTerminal.snark.0",
          "vibex.code.uiTerminal.snark.1",
          "vibex.code.uiTerminal.snark.2",
          "vibex.code.uiTerminal.snark.3"
        ]
      }
    ]
  }
] as const;
