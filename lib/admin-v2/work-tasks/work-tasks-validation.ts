export const workStatuses = ["todo","doing","blocked","done"] as const;
export const workPriorities = ["low","normal","high"] as const;
export type WorkStatus = typeof workStatuses[number];
export type WorkPriority = typeof workPriorities[number];

export function safeTaskPayload(raw: unknown, edit=false) {
 if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
 const obj=raw as Record<string,unknown>;
 const title=typeof obj.title==="string"?obj.title.trim():"";
 const description=typeof obj.description==="string"?obj.description.trim():"";
 const assignee=typeof obj.assignee==="string"?obj.assignee.trim():"";
 const priority=obj.priority;
 const status=edit?obj.status:"todo";
 const version=edit?obj.version:1;
 const rawDate=obj.dueDate;
 const dueDate=rawDate===null || rawDate==="" ? null : typeof rawDate==="string"?rawDate:null;
 if(title.length<3 || title.length>160 || description.length>2000 || assignee.length>120 ||
    !workPriorities.some(x=>x===priority) || !workStatuses.some(x=>x===status) ||
    (edit&&(!Number.isSafeInteger(version)||typeof version!=="number"||version<1)) ||
    (dueDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      Number.isNaN(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0,10)!==dueDate))) return null;
 return {
  title, description, assignee, priority:priority as WorkPriority,
  status:status as WorkStatus, dueDate, version:version as number,
 };
}
