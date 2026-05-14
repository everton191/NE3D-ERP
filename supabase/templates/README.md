# Templates de email do Simplifica 3D

Templates HTML para os emails automáticos do Supabase Auth.

Aplicar no remoto:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<token-da-conta-supabase>"
npm run supabase:emails:apply
```

Validar sem aplicar:

```powershell
npm run supabase:emails:dry-run
```

Observações:

- O email oficial de suporte é `simplifica3d.app@gmail.com`.
- Para o remetente aparecer como `Simplifica 3D`, o Supabase precisa de SMTP customizado configurado e autorizado. O script só tenta alterar `smtp_admin_email`/`smtp_sender_name` quando `SIMPLIFICA3D_ENABLE_SMTP_FROM=1`.
- Os botões usam `{{ .ConfirmationURL }}`, conforme os templates oficiais do Supabase.
- A URL pública padrão é `https://erpne3d-everton191s-projects.vercel.app`.
