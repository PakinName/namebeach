"use client";
import { useState, type InputHTMLAttributes } from 'react';
import Icon from './Icon';
import { useLanguage } from '@/components/providers/LanguageProvider';
export default function PasswordInput(props:InputHTMLAttributes<HTMLInputElement>){const[show,setShow]=useState(false);const{language}=useLanguage();return <div style={{position:'relative'}}><input {...props} type={show?'text':'password'} className="form-input" style={{...props.style,paddingRight:52}}/><button type="button" className="btn btn-ghost" style={{position:'absolute',right:4,top:4,padding:8}} aria-label={language==='th'?(show?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน'):(show?'Hide password':'Show password')} aria-pressed={show} onClick={()=>setShow(!show)}><Icon name="eye" size={18}/></button></div>}
