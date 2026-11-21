"use client";

import { useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button,
  Chip, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import type { AdminSettings } from "@/app/lib/admin-settings";

type Group = "storeProfile" | "checkoutSettings" | "policySettings" | "seoSettings" | "notificationSettings" | "appearanceSettings";
export type EditableWebsiteSettings = Pick<AdminSettings, Group>;
export type EditableWebsitePermissions = Record<Group, boolean>;
type Field = { key: string; label: string; kind?: "textarea" | "toggle" | "select"; options?: string[]; max?: number };
type Section = { group: Group; title: string; description: string; fields: Field[] };
const sections: Section[] = [
  { group:"storeProfile", title:"Brand & customer contact", description:"Storefront identity, social links, footer and live-support contact options.",
    fields:[
      {key:"brandSubtitle",label:"Brand subtitle"},
      {key:"supportWhatsApp",label:"WhatsApp support number"},
      {key:"supportAgentImageUrl",label:"Support agent photo URL"},
      {key:"facebookPageUrl",label:"Facebook page URL"},
      {key:"instagramUrl",label:"Instagram URL"},
      {key:"tiktokUrl",label:"TikTok URL"},
      {key:"youtubeUrl",label:"YouTube URL"},
      {key:"footerShortDescription",label:"Footer description",kind:"textarea",max:1000},
      {key:"showFooterLegalLinks",label:"Show footer legal links",kind:"toggle"},
      {key:"showSocialIcons",label:"Show social icons",kind:"toggle"},
      {key:"showWhatsAppFooterIcon",label:"Show WhatsApp footer icon",kind:"toggle"},
      {key:"liveSupportMode",label:"Live support mode",kind:"select",options:["off","live_chat","whatsapp","both"]},
    ] },
  { group:"checkoutSettings",title:"Checkout messages",description:"Edit real customer-facing checkout wording. Delivery prices remain in Core Settings.",
    fields:[
      {key:"checkoutHeaderText",label:"Checkout title"},
      {key:"checkoutSupportMessage",label:"Checkout help text",kind:"textarea",max:1000},
      {key:"orderConfirmationMessage",label:"Order confirmation text",kind:"textarea",max:1000},
      {key:"orderReviewMessage",label:"Order review text",kind:"textarea",max:1000},
      {key:"cartEmptyMessage",label:"Empty cart message"},
    ] },
  { group:"policySettings",title:"Policies & customer guidance",description:"Review policy copy carefully before publishing. These fields do not authorize automatic refunds.",
    fields:[
      {key:"hygieneSafeSupportMessage",label:"Hygiene-safe support",kind:"textarea",max:1500},
      {key:"refundExchangeCondition",label:"Refund/exchange conditions",kind:"textarea",max:2000},
      {key:"unusedUnwashedCondition",label:"Unused/unwashed condition",kind:"textarea",max:1500},
      {key:"originalPackagingHygieneSealMessage",label:"Packaging and hygiene seal",kind:"textarea",max:1500},
      {key:"sizeCheckingInstruction",label:"Sizing instruction",kind:"textarea",max:1500},
      {key:"privacyPackagingMessage",label:"Discreet packaging statement",kind:"textarea",max:1500},
      {key:"noMedicalClaimsNotice",label:"No medical claims statement",kind:"textarea",max:1500},
    ] },
  { group:"seoSettings",title:"SEO & analytics identifiers",description:"Edit SEO content and tracking IDs without claiming an external service is connected.",
    fields:[
      {key:"homepageSeoTitle",label:"Homepage SEO title"},
      {key:"homepageMetaDescription",label:"Meta description",kind:"textarea",max:400},
      {key:"defaultProductSeoSuffix",label:"Product SEO suffix"},
      {key:"facebookPixelId",label:"Facebook Pixel ID"},
      {key:"tiktokPixelId",label:"TikTok Pixel ID"},
      {key:"googleAnalyticsId",label:"Google Analytics ID"},
      {key:"openGraphImageUrl",label:"Open Graph image URL"},
    ] },
  { group:"notificationSettings",title:"Notification preferences",description:"Saving switches and templates does not verify Telegram connectivity or send messages.",
    fields:[
      {key:"telegramNewOrderEnabled",label:"New order Telegram notifications",kind:"toggle"},
      {key:"telegramStatusUpdateEnabled",label:"Order status Telegram notifications",kind:"toggle"},
      {key:"orderConfirmationMessageTemplate",label:"Order confirmation template",kind:"textarea",max:1500},
      {key:"shippedMessageTemplate",label:"Shipped message template",kind:"textarea",max:1500},
      {key:"deliveredMessageTemplate",label:"Delivered message template",kind:"textarea",max:1500},
      {key:"cancelledMessageTemplate",label:"Cancelled message template",kind:"textarea",max:1500},
    ] },
  { group:"appearanceSettings",title:"Storefront hero & announcement",description:"Change storefront text and notice visibility. The Admin V2 font, background and theme are untouched.",
    fields:[
      {key:"heroBadgeText",label:"Hero badge text"},
      {key:"homepageHeroTitle",label:"Homepage hero title"},
      {key:"homepageHeroSubtitle",label:"Homepage hero subtitle",kind:"textarea",max:1000},
      {key:"primaryCtaText",label:"Primary CTA text"},
      {key:"secondaryCtaText",label:"Secondary CTA text"},
      {key:"enableAnnouncement",label:"Enable announcements",kind:"toggle"},
      {key:"announcementText",label:"Announcement message",kind:"textarea",max:800},
      {key:"announcementLinkLabel",label:"Announcement link label"},
      {key:"announcementLinkUrl",label:"Announcement link URL"},
      {key:"announcementStyle",label:"Announcement style",kind:"select",options:["info","promo","warning","success"]},
      {key:"showOnHomepage",label:"Show notice on homepage",kind:"toggle"},
      {key:"showOnShop",label:"Show notice on shop",kind:"toggle"},
      {key:"showOnProductPages",label:"Show notice on products",kind:"toggle"},
      {key:"showOnCheckout",label:"Show notice on checkout",kind:"toggle"},
    ] },
];

function values(state: EditableWebsiteSettings, group: Group) {
  return state[group] as unknown as Record<string,string|boolean>;
}
function valid(field: Field, value: unknown) {
  if (field.kind === "toggle") return typeof value === "boolean";
  if (field.kind === "select") return typeof value === "string" && Boolean(field.options?.includes(value));
  if (typeof value !== "string" || value.length > (field.max ?? 500) || value.includes("\0")) return false;
  if (field.key.endsWith("Url") && value.trim()) {
    if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
    try {
      const url = new URL(value);
      return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
    } catch { return false; }
  }
  return true;
}
type SettingsResponse={settings?:AdminSettings;storageMode?:string;errors?:string[]};

export function AdminV2ExtendedSettingsView({initial,storageMode,canEdit}:{
  initial:EditableWebsiteSettings;storageMode:string;canEdit:EditableWebsitePermissions;
}) {
  const [draft,setDraft]=useState(initial);
  const [baseline,setBaseline]=useState(initial);
  const [busy,setBusy]=useState<Group|null>(null);
  const [notice,setNotice]=useState<{type:"error"|"success";message:string}|null>(null);
  const available=storageMode==="supabase";

  function update(group:Group,key:string,value:string|boolean) {
    setDraft(current=>({...current,[group]:{...current[group],[key]:value}}));
  }
  function modified(section:Section) {
    return section.fields.filter(f=>values(draft,section.group)[f.key]!==values(baseline,section.group)[f.key]);
  }
  async function save(section:Section) {
    const group=section.group;
    const edits=modified(section);
    if(!available||!canEdit[group]||busy||!edits.length)return;
    if(edits.some(f=>!valid(f,values(draft,group)[f.key]))) {
      setNotice({type:"error",message:"Check input lengths, URL formats and required options."});return;
    }
    setBusy(group);setNotice(null);
    try {
      const response=await fetch("/api/settings",{credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw new Error("Could not load current store settings.");
      const latest=await response.json() as SettingsResponse;
      if(latest.storageMode!=="supabase"||!latest.settings)throw new Error("Persistent settings are unavailable.");
      const live=latest.settings[group] as unknown as Record<string,string|boolean>;
      if(edits.some(f=>live[f.key]!==values(baseline,group)[f.key])) {
        throw new Error("The same fields changed in another session. Refresh and review before saving.");
      }
      const changes=Object.fromEntries(edits.map(f=>[f.key,values(draft,group)[f.key]]));
      const next:AdminSettings={...latest.settings,[group]:{...latest.settings[group],...changes}};
      const saveResponse=await fetch("/api/settings",{
        method:"PATCH",credentials:"same-origin",cache:"no-store",
        headers:{"content-type":"application/json"},body:JSON.stringify(next),
      });
      const saved=await saveResponse.json().catch(()=>null) as SettingsResponse|null;
      if(!saveResponse.ok||saved?.storageMode!=="supabase"||!saved.settings) {
        throw new Error(saved?.errors?.join(" ")||"The backend did not confirm a saved configuration.");
      }
      const persisted=saved.settings[group];
      setBaseline(current=>({...current,[group]:persisted}));
      setDraft(current=>({...current,[group]:persisted}));
      setNotice({type:"success",message:section.title+" saved successfully to the live settings."});
    } catch(e) {
      setNotice({type:"error",message:e instanceof Error?e.message:"Settings could not be saved."});
    } finally {setBusy(null);}
  }
  return <Box component="section" aria-label="Website configuration" sx={{mt:3,minWidth:0}}>
    <Typography variant="h5" component="h2" sx={{mb:1}}>Website configuration</Typography>
    <Typography variant="body2" color="text.secondary" sx={{mb:2}}>
      Native Admin V2 controls for persisted content, policy, SEO and notifications. All edits require explicit Save.
      Payment-provider credentials and system security are managed separately.
    </Typography>
    {!available?<Alert severity="error" sx={{mb:2}}>Settings storage unavailable. No changes can be saved.</Alert>:null}
    {notice?<Alert severity={notice.type} sx={{mb:2}} onClose={()=>setNotice(null)}>{notice.message}</Alert>:null}
    <Stack spacing={1}>
      {sections.map(section=>{
        const edits=modified(section);
        const editable=available&&canEdit[section.group];
        const errors=section.fields.some(field=>!valid(field,values(draft,section.group)[field.key]));
        return <Accordion key={section.group} disableGutters elevation={0}
          sx={{border:1,borderColor:"divider",borderRadius:"12px !important","&:before":{display:"none"}}}>
          <AccordionSummary expandIcon={<ChevronDown size={18}/>}>
            <Box sx={{flex:1,pr:1}}>
              <Typography variant="subtitle1" sx={{fontWeight:700}}>{section.title}</Typography>
              <Typography variant="caption" color="text.secondary">{section.description}</Typography>
            </Box>
            <Chip size="small" variant="outlined" color={edits.length?"warning":"default"}
              label={edits.length?"Unsaved":editable?"Editable":"Read only"} sx={{mr:2,alignSelf:"center"}}/>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {section.fields.map(field=>{
                const kind=field.kind??"text";
                const value=values(draft,section.group)[field.key];
                return <Grid key={section.group+"."+field.key} size={{xs:12,md:kind==="textarea"?12:6}}>
                  {kind==="toggle"?
                    <FormControlLabel label={field.label} control={<Switch checked={value===true}
                      disabled={!editable||Boolean(busy)} onChange={(_,checked)=>update(section.group,field.key,checked)} />}/>:
                    <TextField fullWidth size="small" label={field.label} select={kind==="select"}
                      multiline={kind==="textarea"} minRows={kind==="textarea"?2:undefined}
                      value={typeof value==="string"?value:""} disabled={!editable||Boolean(busy)}
                      error={!valid(field,value)}
                      slotProps={{htmlInput:{maxLength:field.max??500}}}
                      onChange={e=>update(section.group,field.key,e.target.value)}>
                      {kind==="select"?field.options?.map(option=><MenuItem key={option} value={option}>{option.replaceAll("_"," ")}</MenuItem>):null}
                    </TextField>}
                </Grid>;
              })}
            </Grid>
            <Stack direction="row" spacing={1} sx={{mt:2,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
              <Typography variant="caption" color="text.secondary">
                {editable?"Live values are checked before save. Changes are audited.":"Requires the corresponding settings permission."}
              </Typography>
              <Button variant="contained" disabled={!editable||Boolean(busy)||!edits.length||errors} onClick={()=>void save(section)}>
                {busy===section.group?"Saving…":"Save "+section.title}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>;
      })}
    </Stack>
  </Box>;
}
