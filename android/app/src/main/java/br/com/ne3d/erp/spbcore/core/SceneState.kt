package br.com.ne3d.erp.spbcore.core

import br.com.ne3d.erp.spbcore.scene.Panel3D
/** Initialized before renderer creation; mutations and rendering are confined to the GL owner. */
class SceneState { val panels = ArrayList<Panel3D>() }
