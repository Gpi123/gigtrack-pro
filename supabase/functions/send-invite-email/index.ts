// Supabase Edge Function para enviar emails de convite
// Requer: Resend API Key configurada nas variáveis de ambiente do Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verificar API key do Resend
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { inviteId, bandName, inviterName } = await req.json()

    if (!inviteId) {
      return new Response(JSON.stringify({ error: 'inviteId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Buscar dados do convite no banco
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const { data: invite, error: inviteError } = await supabase
      .from('band_invites')
      .select('*, band:bands!band_invites_band_id_fkey(id, name)')
      .eq('id', inviteId)
      .single()

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: 'Invite not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const band = invite.band || { name: bandName || 'uma banda' }
    const inviter = inviterName || 'Um membro da banda'

    // Criar link de aceitação (você precisará criar uma página de aceitação)
    const acceptUrl = `${Deno.env.get('SITE_URL') || 'https://moonlit-begonia-7bb328.netlify.app'}/accept-invite?token=${invite.token}`

    // Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'GigTrack Pro <noreply@gigtrackpro.com>', // Configure seu domínio no Resend
        to: invite.email,
        subject: `Você foi convidado para a banda ${band.name} no GigTrack Pro`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3057F2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #3057F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎸 Convite para Banda</h1>
              </div>
              <div class="content">
                <p>Olá!</p>
                <p><strong>${inviter}</strong> convidou você para fazer parte da banda <strong>${band.name}</strong> no GigTrack Pro.</p>
                <p>Com este convite, você poderá:</p>
                <ul>
                  <li>Ver e gerenciar a agenda de shows da banda</li>
                  <li>Adicionar e editar eventos</li>
                  <li>Colaborar com outros membros</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${acceptUrl}" class="button">Aceitar Convite</a>
                </p>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; color: #3057F2;">${acceptUrl}</p>
                <p><small>Este convite expira em 7 dias.</small></p>
              </div>
              <div class="footer">
                <p>GigTrack Pro - Sistema de Gestão de Shows</p>
                <p>Se você não esperava este convite, pode ignorar este email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errorData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const emailData = await emailResponse.json()

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailData.id,
      message: 'Email sent successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
