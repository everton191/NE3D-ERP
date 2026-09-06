// Feed to agent-browser eval --stdin; no prompts, tools or data mutations.
JSON.stringify({modules: Object.fromEntries(['Simplifica3dAiCore','Simplifica3dOperationSafety','Simplifica3dCanonicalOrder','Simplifica3dOrderCreatePreparation','Simplifica3dOrderCreateExecutor','Simplifica3dRlm','Simplifica3dAiOrchestrator'].map(k=>[k,!!window[k]])),
  modelScope:window.SimplificaAssistantPack?.modelScope,
  foreignPacks:!!(window.RuralAssistantPack || window.TecAssistantPack || window.StoreEditorAssistantPack),
  capacity:typeof getResumoCapacidadeProducao==='function'?getResumoCapacidadeProducao():null,
  assistant:document.querySelector('.ai-assistant-status')?.getAttribute('aria-label')
});
