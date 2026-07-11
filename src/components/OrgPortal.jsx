import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import AdminShell from './admin/AdminShell.jsx';
export default function OrgPortal(){const {orgId}=useParams();const [ctx,setCtx]=useState(undefined);useEffect(()=>{api.getOrgPortalContext(orgId).then(setCtx).catch(()=>setCtx(null));},[orgId]);if(ctx===undefined)return null;if(!ctx)return <Navigate to="/member" replace/>;return <AdminShell scope={ctx.canEdit?'org-admin':'org-user'} orgId={orgId}/>;}
