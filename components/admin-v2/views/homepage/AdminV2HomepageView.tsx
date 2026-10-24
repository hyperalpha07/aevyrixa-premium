"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
 Alert, Box, Button, Checkbox, Chip, Divider, FormControlLabel, Grid, MenuItem,
 Stack, TextField, Typography,
} from "@mui/material";
import type { HomepageSectionMedia } from "@/app/lib/admin-settings";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import {
 homepageVisibilityKeys, homepageSectionKeys, homepageTextKeys,
 validateHomepageContent, validateHomepageAppearance,
 type HomepageAppearanceDraft,type HomepageContentDraft,
} from "@/lib/admin-v2/homepage/homepage-settings";

const sectionTitles:{[K in typeof homepageSectionKeys[number]]:string}={
 heroMedia:"Hero section media",careMedia:"Care story media",experienceMedia:"Experience story media",
};
const visibilityLabels:Record<string,string>={
 showHero:"Hero",showTrustStrip:"Trust strip",showStatStrip:"Statistics strip",showMarquee:"Scrolling marquee",
 showCategories:"Collections",showFeaturedProducts:"Featured products",showStorySections:"Story sections",
 showTestimonials:"Testimonials",showFAQ:"FAQ",showBottomCTA:"Bottom call to action",splashEnabled:"Intro splash",
};
const textGroups=[
 {title:"Brand introduction",keys:["splashTitle","splashLogoUrl"]},
 {title:"Homepage collections",keys:["collectionsEyebrow","collectionsHeading","collectionsDescription"]},
 {title:"Featured products",keys:["featuredProductsEyebrow","featuredProductsHeading","featuredProductsDescription"]},
 {title:"Statistics & marquee",keys:["statItem1Value","statItem1Label","statItem2Value","statItem2Label",
 "statItem3Value","statItem3Label","marqueeItems"]},
] as const;
const appearanceLabels:Record<keyof HomepageAppearanceDraft,string>={
 heroBadgeText:"Hero badge",homepageHeroTitle:"Hero headline",homepageHeroSubtitle:"Hero description",
 primaryCtaText:"Main CTA label",secondaryCtaText:"Secondary CTA label",
};

type StatusMessage={severity:"success"|"error";text:string};
export function AdminV2HomepageView({
 initialContent,initialAppearance,available,canEditContent,canEditAppearance,
}:{
 initialContent:HomepageContentDraft;initialAppearance:HomepageAppearanceDraft;
 available:boolean;canEditContent:boolean;canEditAppearance:boolean;
}){
 const [content,setContent]=useState(initialContent);
 const [baseContent,setBaseContent]=useState(initialContent);
 const [appearance,setAppearance]=useState(initialAppearance);
 const [baseAppearance,setBaseAppearance]=useState(initialAppearance);
 const [busy,setBusy]=useState<"content"|"appearance"|null>(null);
 const [uploading,setUploading]=useState("");
 const [status,setStatus]=useState<StatusMessage|null>(null);
 const contentDirty=JSON.stringify(content)!==JSON.stringify(baseContent);
 const appearanceDirty=JSON.stringify(appearance)!==JSON.stringify(baseAppearance);
 const contentValid=validateHomepageContent(content);
 const appearanceValid=validateHomepageAppearance(appearance);
 const locked=Boolean(busy)||Boolean(uploading)||!available;
 function updateSection<K extends keyof HomepageSectionMedia>(section:typeof homepageSectionKeys[number],key:K,value:HomepageSectionMedia[K]){
  setContent(old=>({...old,[section]:{...old[section],[key]:value}}));
 }
 async function save(kind:"content"|"appearance"){
  if(locked)return;
  if(kind==="content"&&(!canEditContent||!contentDirty||!contentValid))return;
  if(kind==="appearance"&&(!canEditAppearance||!appearanceDirty||!appearanceValid))return;
  setBusy(kind);setStatus(null);
  try{
   const response=await fetch("/api/admin-v2/homepage",{
    method:"PATCH",headers:{"content-type":"application/json"},cache:"no-store",
    body:JSON.stringify({kind,before:kind==="content"?baseContent:baseAppearance,
      after:kind==="content"?content:appearance}),
   });
   const data=await response.json().catch(()=>({})) as {updated?:unknown;errors?:string[]};
   if(!response.ok||!data.updated)
    throw new Error(data.errors?.join(" ")||"Homepage update was not confirmed.");
   if(kind==="content"){
    if(!validateHomepageContent(data.updated))throw new Error("Saved homepage source was invalid. Refresh.");
    setContent(data.updated);setBaseContent(data.updated);
   }else{
    if(!validateHomepageAppearance(data.updated))throw new Error("Saved hero copy was invalid. Refresh.");
    setAppearance(data.updated);setBaseAppearance(data.updated);
   }
   setStatus({severity:"success",text:kind==="content"?"Homepage sections & media saved to the real storefront settings.":"Hero copy saved to the real storefront settings."});
  }catch(error){
   setStatus({severity:"error",text:error instanceof Error?error.message:"Homepage update failed."});
  }finally{setBusy(null);}
 }
 async function upload(section:typeof homepageSectionKeys[number],field:"imageUrl"|"videoUrl",file:File|undefined){
  if(!file||locked||!canEditContent)return;
  const key=`${section}:${field}`;
  setUploading(key);setStatus(null);
  try{
   const form=new FormData();
   form.append("file",file);
   form.append("section",section==="heroMedia"?"hero":section==="careMedia"?"care":"experience");
   const response=await fetch("/api/homepage-media/upload",{method:"POST",body:form,credentials:"same-origin"});
   const data=await response.json().catch(()=>({})) as {url?:string;errors?:string[]};
   if(!response.ok||!data.url)throw new Error(data.errors?.join(" ")||"Upload was not confirmed.");
   updateSection(section,field,data.url);
   setStatus({severity:"success",text:"Upload complete. Save homepage sections to publish this media reference."});
  }catch(error){
   setStatus({severity:"error",text:error instanceof Error?error.message:"Media upload failed."});
  }finally{setUploading("");}
 }
 return <>
  <V2PageHeader title="Homepage Content" description="Manage real storefront sections, hero copy and homepage media. Desktop-first; no placeholder content."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Homepage"}]}
   actions={<Button component={Link} href="/" variant="outlined" target="_blank">View storefront</Button>}/>
  <Stack spacing={2.5}>
   {!available?<Alert severity="error">Persisted homepage settings source is unavailable. Editing is disabled to avoid false saves.</Alert>:null}
   {!canEditContent?<Alert severity="info">You can view this page but cannot edit homepage sections or media without homepage.manage permission.</Alert>:null}
   {status?<Alert severity={status.severity} onClose={()=>setStatus(null)}>{status.text}</Alert>:null}
   <V2Card>
    <Stack spacing={2}>
     <Stack direction="row" spacing={1.5} sx={{alignItems:"center",justifyContent:"space-between"}}>
      <Typography variant="h6">Storefront sections</Typography>
      <Chip label={contentDirty?"Unsaved section changes":"Saved"} size="small" variant="outlined" />
     </Stack>
     <Grid container spacing={1}>
      {homepageVisibilityKeys.map(key=>(
       <Grid key={key} size={{xs:12,md:6,lg:4}}>
        <FormControlLabel control={<Checkbox checked={content[key]}
          disabled={locked||!canEditContent}
          onChange={(_,checked)=>setContent(old=>({...old,[key]:checked}))}/>}
         label={visibilityLabels[key]} />
       </Grid>
      ))}
     </Grid>
     <Divider/>
     {textGroups.map(group=>(
      <Stack key={group.title} spacing={1.25}>
       <Typography variant="subtitle1" sx={{fontWeight:700}}>{group.title}</Typography>
       <Grid container spacing={1.5}>
        {group.keys.map(key=>(
         <Grid key={key} size={{xs:12,md:key==="marqueeItems"||key.endsWith("Description")?12:6}}>
          <TextField fullWidth size="small" value={content[key]} label={key.replace(/([A-Z])/g," $1").replace(/^./,a=>a.toUpperCase())}
           multiline={key==="marqueeItems"||key.endsWith("Description")} minRows={key.endsWith("Description")?2:undefined}
           disabled={locked||!canEditContent}
           onChange={event=>setContent(old=>({...old,[key]:event.target.value}))}/>
         </Grid>
        ))}
       </Grid>
      </Stack>
     ))}
     <Divider/>
     <Typography variant="h6">Homepage media & editorial sections</Typography>
     {homepageSectionKeys.map(section=>(
      <Stack key={section} spacing={1.5} sx={{p:2,border:"1px solid",borderColor:"divider",borderRadius:2}}>
       <Typography variant="subtitle1" sx={{fontWeight:700}}>{sectionTitles[section]}</Typography>
       <Grid container spacing={1.5}>
        <Grid size={{xs:12,md:4}}>
         <TextField select label="Media mode" fullWidth size="small" value={content[section].mode}
          disabled={locked||!canEditContent} onChange={e=>updateSection(section,"mode",e.target.value as HomepageSectionMedia["mode"])}>
          <MenuItem value="animation">Atmospheric animation</MenuItem>
          <MenuItem value="image">Image</MenuItem>
          <MenuItem value="video">Video</MenuItem>
         </TextField>
        </Grid>
        {(["eyebrow","heading","subheading","ctaText","ctaLink","altText"] as const).map(key=>(
         <Grid key={key} size={{xs:12,md:key==="subheading"?12:6}}>
          <TextField fullWidth size="small" label={key.replace(/([A-Z])/g," $1")}
           value={content[section][key]} disabled={locked||!canEditContent}
           onChange={e=>updateSection(section,key,e.target.value)}/>
         </Grid>
        ))}
        {(["imageUrl","videoUrl"] as const).map(field=>(
         <Grid key={field} size={{xs:12,md:6}}>
          <Stack spacing={1}>
           <TextField fullWidth size="small" label={field==="imageUrl"?"Image URL":"Video URL"}
            value={content[section][field]} disabled={locked||!canEditContent}
            onChange={e=>updateSection(section,field,e.target.value)}/>
           <Stack direction="row" spacing={1} sx={{alignItems:"center"}}>
            <Button variant="outlined" size="small" component="label" disabled={locked||!canEditContent}>
             {uploading===`${section}:${field}`?"Uploading…":field==="imageUrl"?"Upload image":"Upload video"}
             <input hidden type="file" accept={field==="imageUrl"?"image/jpeg,image/png,image/webp,image/gif":"video/mp4,video/webm,video/quicktime,video/x-m4v"}
              onChange={(e:ChangeEvent<HTMLInputElement>)=>{void upload(section,field,e.target.files?.[0]);e.currentTarget.value="";}}/>
            </Button>
            <Button size="small" disabled={locked||!canEditContent||!content[section][field]}
             onClick={()=>updateSection(section,field,"")}>Clear</Button>
           </Stack>
           {field==="imageUrl"&&content[section].imageUrl?<Box component="img" alt={content[section].altText||sectionTitles[section]}
            src={content[section].imageUrl} sx={{width:230,height:120,objectFit:"cover",borderRadius:1}}/>:null}
          </Stack>
         </Grid>
        ))}
       </Grid>
      </Stack>
     ))}
     <Stack direction="row" spacing={2} sx={{alignItems:"center",justifyContent:"flex-end"}}>
      <Typography variant="caption" color="text.secondary">{contentDirty?"Changes are not live until saved.":"Up to date"}</Typography>
      <Button variant="contained" disabled={locked||!canEditContent||!contentDirty||!contentValid} onClick={()=>void save("content")}>
       {busy==="content"?"Saving…":"Save homepage sections"}
      </Button>
     </Stack>
    </Stack>
   </V2Card>
   <V2Card>
    <Stack spacing={2}>
     <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}} spacing={1}>
      <Typography variant="h6">Hero headline & brand copy</Typography>
      <Chip size="small" variant="outlined" label={appearanceDirty?"Unsaved copy changes":"Saved"}/>
     </Stack>
     <Alert severity="info">Hero brand copy is saved separately. It requires store basic-settings permission; this does not change payment or shipping settings.</Alert>
     <Grid container spacing={1.5}>
      {(Object.keys(appearanceLabels) as (keyof HomepageAppearanceDraft)[]).map(key=>(
       <Grid key={key} size={{xs:12,md:key==="homepageHeroSubtitle"?12:6}}>
        <TextField fullWidth size="small" label={appearanceLabels[key]} value={appearance[key]}
         multiline={key==="homepageHeroSubtitle"} minRows={key==="homepageHeroSubtitle"?2:undefined}
         disabled={locked||!canEditAppearance} onChange={e=>setAppearance(old=>({...old,[key]:e.target.value}))}/>
       </Grid>
      ))}
     </Grid>
     <Stack direction="row" sx={{justifyContent:"flex-end"}}>
      <Button variant="contained" disabled={locked||!canEditAppearance||!appearanceDirty||!appearanceValid}
       onClick={()=>void save("appearance")}>{busy==="appearance"?"Saving…":"Save hero copy"}</Button>
     </Stack>
    </Stack>
   </V2Card>
  </Stack>
 </>;
}
