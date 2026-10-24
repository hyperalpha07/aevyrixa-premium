"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
 Alert, Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Divider,
 Grid, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import type { AdminSettings } from "@/app/lib/admin-settings";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import {
 adminV2CategoryModes, extractAdminV2Categories, mergeAdminV2Categories,
 validateAdminV2CategoryCards, type AdminV2CategoryCard,
} from "@/lib/admin-v2/categories/category-settings";

const categoryStates = [
 {value:"active",label:"Active"},
 {value:"coming_soon",label:"Coming soon"},
 {value:"hidden",label:"Hidden"},
] as const;
const modeLabels:Record<string,string> = {
 animation:"Animation",image_text:"Image + text",
 video_text:"Video + text",background_media_text:"Background + text",media_only:"Media only",
};

export function AdminV2CategoriesView({
 initial, available, storageMode, canManage,
}: {initial:AdminV2CategoryCard[];available:boolean;storageMode:string;canManage:boolean}) {
 const [cards,setCards]=useState(initial);
 const [baseline,setBaseline]=useState(initial);
 const [saving,setSaving]=useState(false);
 const [uploadKey,setUploadKey]=useState("");
 const [notice,setNotice]=useState<{type:"error"|"success";text:string}|null>(null);
 const [expanded,setExpanded]=useState<string|false>(initial[0]?.slug??false);
 const edit=<K extends keyof AdminV2CategoryCard>(index:number,key:K,value:AdminV2CategoryCard[K])=>
  setCards(current=>current.map((card,i)=>i===index?{...card,[key]:value}:card));
 const dirty=JSON.stringify(cards)!==JSON.stringify(baseline);
 const problem=validateAdminV2CategoryCards(cards);
 const busy=saving||Boolean(uploadKey);
 async function upload(index:number,field:"imageUrl"|"videoUrl",file:File|undefined) {
  if (!file || busy || !canManage || !available) return;
  const card=cards[index];
  const key=`${card.slug}-${field}`;
  setUploadKey(key);setNotice(null);
  try {
   const form=new FormData();
   form.append("file",file);
   form.append("section",`category-${card.slug}`);
   const response=await fetch("/api/homepage-media/upload",{method:"POST",body:form,credentials:"same-origin"});
   const data=await response.json().catch(()=>({}));
   if (!response.ok || typeof data.url!=="string")
     throw new Error(Array.isArray(data.errors)?data.errors.join(" "):"Media upload was not confirmed.");
   edit(index,field,data.url);
   setNotice({type:"success",text:"Media uploaded. Save category settings to publish this media URL."});
  } catch(e) {
   setNotice({type:"error",text:e instanceof Error?e.message:"Media upload failed."});
  } finally {setUploadKey("");}
 }
 async function save() {
  if(busy||!dirty||!canManage||!available)return;
  const invalid=validateAdminV2CategoryCards(cards);
  if(invalid){setNotice({type:"error",text:invalid});return;}
  setSaving(true);setNotice(null);
  try{
   const latest=await fetch("/api/settings",{cache:"no-store"});
   if(!latest.ok)throw new Error("Could not load latest store settings.");
   const result=await latest.json() as {settings?:AdminSettings;storageMode?:string};
   if(!result.settings||result.storageMode!=="supabase")throw new Error("Persisted settings are unavailable.");
   const freshCards=extractAdminV2Categories(result.settings.homepageMediaSettings);
   if(JSON.stringify(freshCards)!==JSON.stringify(baseline))
     throw new Error("Category settings changed in another session. Refresh before saving.");
   const next:AdminSettings={...result.settings,homepageMediaSettings:
     mergeAdminV2Categories(result.settings.homepageMediaSettings,cards)};
   const response=await fetch("/api/settings",{
     method:"PATCH",headers:{"content-type":"application/json"},cache:"no-store",body:JSON.stringify(next),
   });
   const saved=await response.json().catch(()=>({})) as {
     errors?:string[];settings?:AdminSettings;storageMode?:string
   };
   if(!response.ok||saved.storageMode!=="supabase"||!saved.settings)
     throw new Error(saved.errors?.join(" ")??"Categories could not be saved.");
   const updated=extractAdminV2Categories(saved.settings.homepageMediaSettings);
   setCards(updated);setBaseline(updated);
   setNotice({type:"success",text:"All seven categories were saved to the persisted storefront configuration."});
  }catch(e){
   setNotice({type:"error",text:e instanceof Error?e.message:"Save failed."});
  }finally{setSaving(false);}
 }
 return <>
  <V2PageHeader title="Categories" description="Manage seven genuine Noromi Care storefront collections. Changes are published only after Save."
    breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Categories"}]}
    actions={<Stack direction="row" spacing={1}>
      <Button component={Link} href="/admin/categories" variant="outlined">Classic category tools</Button>
      <Button variant="contained" disabled={!available||!canManage||busy||!dirty||!!problem}
        onClick={()=>void save()}>{saving?"Saving…":"Save categories"}</Button>
    </Stack>}/>
  <Stack spacing={2}>
    {!available?<Alert severity="error">Persistent category backend unavailable ({storageMode}). Editing is disabled to prevent fake success.</Alert>:null}
    {!canManage?<Alert severity="info">Read-only access. Only authorized category editors can publish changes.</Alert>:null}
    {notice?<Alert severity={notice.type} onClose={()=>setNotice(null)}>{notice.text}</Alert>:null}
    {problem&&dirty?<Alert severity="warning">{problem}</Alert>:null}
    <V2Card>
     <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
        <Typography variant="subtitle1" sx={{fontWeight:700}}>Homepage category cards</Typography>
        <Typography variant="caption" color="text.secondary">7 categories · Status / Content / Media / Sort</Typography>
      </Stack>
      <Divider/>
      {cards.map((card,index)=>(
       <Accordion key={card.slug} disableGutters expanded={expanded===card.slug}
         onChange={(_,open)=>setExpanded(open?card.slug:false)}
         elevation={0} sx={{border:"1px solid",borderColor:"divider",borderRadius:1,
           "&:before":{display:"none"},overflow:"hidden"}}>
        <AccordionSummary expandIcon={<ChevronDown size={16}/>}>
         <Stack direction="row" spacing={1.5} sx={{alignItems:"center",width:"100%",flexWrap:"wrap"}}>
          <Typography variant="body2" sx={{fontWeight:700}}>{card.label}</Typography>
          <Chip size="small" variant="outlined" label={categoryStates.find(s=>s.value===card.status)?.label??"Unknown"}
            color={card.status==="active"?"success":card.status==="coming_soon"?"warning":"default"}/>
          <Typography variant="caption" color="text.secondary">Position {card.sortOrder}</Typography>
         </Stack>
        </AccordionSummary>
        <AccordionDetails>
         <Stack spacing={2}>
          <Grid container spacing={2}>
           <Grid size={{xs:12,md:3}}>
            <TextField select size="small" fullWidth label="Visibility" value={card.status} disabled={!canManage||!available||busy}
              onChange={e=>edit(index,"status",e.target.value as AdminV2CategoryCard["status"])}>
              {categoryStates.map(item=><MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>
           </Grid>
           <Grid size={{xs:12,md:3}}>
            <TextField size="small" fullWidth label="Homepage order (1–999)" value={card.sortOrder}
              disabled={!canManage||!available||busy} onChange={e=>edit(index,"sortOrder",e.target.value)}/>
           </Grid>
           <Grid size={{xs:12,md:6}}>
            <TextField size="small" fullWidth label="Display title" value={card.title} disabled={!canManage||!available||busy}
              onChange={e=>edit(index,"title",e.target.value)}/>
           </Grid>
           <Grid size={{xs:12,md:6}}>
            <TextField size="small" fullWidth label="Description" multiline minRows={2} value={card.description}
              disabled={!canManage||!available||busy} onChange={e=>edit(index,"description",e.target.value)}/>
           </Grid>
           <Grid size={{xs:12,md:6}}>
            <TextField size="small" fullWidth label="Collection link" value={card.linkUrl}
              disabled={!canManage||!available||busy} onChange={e=>edit(index,"linkUrl",e.target.value)}/>
           </Grid>
           <Grid size={{xs:12,md:6}}>
            <TextField select size="small" fullWidth label="Card media mode" value={card.mediaMode}
              disabled={!canManage||!available||busy} onChange={e=>edit(index,"mediaMode",e.target.value as AdminV2CategoryCard["mediaMode"])}>
              {adminV2CategoryModes.map(mode=><MenuItem key={mode} value={mode}>{modeLabels[mode]}</MenuItem>)}
            </TextField>
           </Grid>
           <Grid size={{xs:12,md:6}}>
            <TextField size="small" fullWidth label="Image alt text" value={card.altText} disabled={!canManage||!available||busy}
              onChange={e=>edit(index,"altText",e.target.value)}/>
           </Grid>
          </Grid>
          <Divider/>
          <Typography variant="subtitle2">Media</Typography>
          <Grid container spacing={2}>
           {(["imageUrl","videoUrl"] as const).map(field=>(
            <Grid key={field} size={{xs:12,md:6}}>
             <Stack spacing={1}>
              <TextField size="small" fullWidth label={field==="imageUrl"?"Image URL":"Video URL"}
                value={card[field]} disabled={!canManage||!available||busy}
                onChange={e=>edit(index,field,e.target.value)}/>
              <Stack direction="row" spacing={1} sx={{alignItems:"center"}}>
               <Button size="small" variant="outlined" component="label" disabled={!canManage||!available||busy}>
                {uploadKey===`${card.slug}-${field}`?"Uploading…":field==="imageUrl"?"Upload image":"Upload video"}
                <input hidden type="file" accept={field==="imageUrl"?"image/jpeg,image/png,image/webp,image/gif":"video/mp4,video/webm,video/quicktime,video/x-m4v"}
                  onChange={(event:ChangeEvent<HTMLInputElement>)=>{
                    void upload(index,field,event.target.files?.[0]);
                    event.currentTarget.value="";
                  }}/>
               </Button>
               <Button size="small" disabled={!canManage||!available||busy||!card[field]}
                 onClick={()=>edit(index,field,"")}>Clear link</Button>
              </Stack>
              {field==="imageUrl"&&card.imageUrl?
                <Box component="img" alt={card.altText||card.label} src={card.imageUrl}
                  sx={{width:200,maxHeight:120,objectFit:"contain",borderRadius:1}}/>:null}
             </Stack>
            </Grid>
           ))}
          </Grid>
          <Alert severity="info">Active cards require a valid link. Coming soon cards remain visible but not clickable; Hidden cards are removed from the homepage. Uploaded media is not published until saved.</Alert>
         </Stack>
        </AccordionDetails>
       </Accordion>
      ))}
      <Stack direction="row" spacing={2} sx={{justifyContent:"flex-end",alignItems:"center",pt:1}}>
        <Typography variant="caption" color="text.secondary">{dirty?"Unsaved changes":"All changes saved"}</Typography>
        <Button variant="contained" disabled={!available||!canManage||busy||!dirty||!!problem}
          onClick={()=>void save()}>Save all seven categories</Button>
      </Stack>
     </Stack>
    </V2Card>
  </Stack>
 </>;
}
