"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  CreditCard,
  AlertCircle,
  ChevronDown,
  Calendar,
  FileText,
  Bell,
  Printer,
  RefreshCw,
  Wallet,
  TrendingUp,
  PieChart,
  Send,
  Ban,
  Receipt,
  MoreVertical,
  Settings,
  Tag,
  Layers,
  UserPlus,
  BookOpen,
  LayoutGrid,
  Activity,
  Shield,
  Smartphone,
  Globe,
  Key,
  Save,
  X,
  PlusCircle,
  MinusCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  LogOut,
  HelpCircle,
} from "lucide-react";

// ==================== TYPES ====================
interface FeeType {
  id: string;
  name: string;
  amount: number;
  frequency: "termly" | "monthly" | "one-time";
  category: "compulsory" | "optional";
  taxRate: number;
  glCode: string;
  isActive: boolean;
}

interface FeeStructure {
  id: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  academicYear: string;
  feeTypeId: string;
  feeTypeName: string;
  amount: number;
}

interface Student {
  id: string;
  name: string;
  className: string;
  classId: string;
  parentEmail: string;
  phone: string;
  studentId: string;
}

interface StudentFeeOverride {
  id: string;
  studentId: string;
  studentName: string;
  feeTypeId: string;
  feeTypeName: string;
  termId: string;
  termName: string;
  academicYear: string;
  amount: number;
  reason: string;
}

interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  invoiceNumber: string;
  termId: string;
  termName: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "paid" | "partial" | "overdue" | "unpaid";
  dueDate: string;
  createdAt: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  feeTypeId: string;
  feeTypeName: string;
  amount: number;
  paidAmount: number;
}

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  method: "card" | "mobile_money" | "bank_transfer" | "cash" | "cheque";
  reference: string;
  date: string;
  status: "confirmed" | "pending" | "failed";
  receiptNumber: string;
  invoiceId: string;
}

interface PaymentGatewayConfig {
  isEnabled: boolean;
  provider: "stripe" | "paystack" | "flutterwave" | "none";
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
}

interface Term {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  isActive: boolean;
}

interface Class {
  id: string;
  name: string;
  level: string;
}

// ==================== MOCK DATA ====================
const mockFeeTypes: FeeType[] = [
  { id: "ft1", name: "Tuition Fee", amount: 1000, frequency: "termly", category: "compulsory", taxRate: 0, glCode: "4100", isActive: true },
  { id: "ft2", name: "Transport Fee", amount: 200, frequency: "termly", category: "optional", taxRate: 0, glCode: "4200", isActive: true },
  { id: "ft3", name: "Sports & Activities", amount: 150, frequency: "termly", category: "optional", taxRate: 0, glCode: "4300", isActive: true },
  { id: "ft4", name: "Technology Levy", amount: 100, frequency: "termly", category: "compulsory", taxRate: 0, glCode: "4400", isActive: true },
  { id: "ft5", name: "Meals Fee", amount: 250, frequency: "monthly", category: "optional", taxRate: 0, glCode: "4500", isActive: true },
  { id: "ft6", name: "Examination Fee", amount: 80, frequency: "termly", category: "compulsory", taxRate: 0, glCode: "4600", isActive: true },
];

const mockClasses: Class[] = [
  { id: "c1", name: "Grade 5A", level: "Primary" },
  { id: "c2", name: "Grade 5B", level: "Primary" },
  { id: "c3", name: "Grade 6A", level: "Primary" },
  { id: "c4", name: "Grade 6B", level: "Primary" },
  { id: "c5", name: "Grade 7A", level: "Middle" },
  { id: "c6", name: "Grade 7B", level: "Middle" },
];

const mockTerms: Term[] = [
  { id: "t1", name: "Term 1", academicYear: "2025", startDate: "2025-01-10", endDate: "2025-04-10", dueDate: "2025-02-15", isActive: true },
  { id: "t2", name: "Term 2", academicYear: "2025", startDate: "2025-05-01", endDate: "2025-08-01", dueDate: "2025-05-30", isActive: false },
  { id: "t3", name: "Term 3", academicYear: "2025", startDate: "2025-09-01", endDate: "2025-12-01", dueDate: "2025-09-30", isActive: false },
];

const mockStudents: Student[] = [
  { id: "s1", name: "James Wilson", className: "Grade 5A", classId: "c1", parentEmail: "james.parent@email.com", phone: "+1234567890", studentId: "STU-001" },
  { id: "s2", name: "Sarah Johnson", className: "Grade 5A", classId: "c1", parentEmail: "sarah.parent@email.com", phone: "+1234567891", studentId: "STU-002" },
  { id: "s3", name: "Michael Brown", className: "Grade 6B", classId: "c4", parentEmail: "michael.parent@email.com", phone: "+1234567892", studentId: "STU-003" },
  { id: "s4", name: "Emily Davis", className: "Grade 6B", classId: "c4", parentEmail: "emily.parent@email.com", phone: "+1234567893", studentId: "STU-004" },
  { id: "s5", name: "Daniel Martinez", className: "Grade 7A", classId: "c5", parentEmail: "daniel.parent@email.com", phone: "+1234567894", studentId: "STU-005" },
  { id: "s6", name: "Sophia Garcia", className: "Grade 7A", classId: "c5", parentEmail: "sophia.parent@email.com", phone: "+1234567895", studentId: "STU-006" },
  { id: "s7", name: "Alexander Lee", className: "Grade 5B", classId: "c2", parentEmail: "alex.parent@email.com", phone: "+1234567896", studentId: "STU-007" },
  { id: "s8", name: "Olivia Rodriguez", className: "Grade 6A", classId: "c3", parentEmail: "olivia.parent@email.com", phone: "+1234567897", studentId: "STU-008" },
];

// Generate mock fee structures
const generateMockFeeStructures = (): FeeStructure[] => {
  const structures: FeeStructure[] = [];
  mockClasses.forEach(cls => {
    mockFeeTypes.forEach(ft => {
      if (ft.isActive) {
        mockTerms.filter(t => t.isActive).forEach(term => {
          structures.push({
            id: `fs_${cls.id}_${ft.id}_${term.id}`,
            classId: cls.id,
            className: cls.name,
            termId: term.id,
            termName: term.name,
            academicYear: term.academicYear,
            feeTypeId: ft.id,
            feeTypeName: ft.name,
            amount: ft.amount,
          });
        });
      }
    });
  });
  return structures;
};

// Generate mock invoices
const generateMockInvoices = (students: Student[], feeStructures: FeeStructure[], terms: Term[]): Invoice[] => {
  const invoices: Invoice[] = [];
  const activeTerm = terms.find(t => t.isActive)!;
  
  students.forEach((student, idx) => {
    const studentFees = feeStructures.filter(fs => fs.classId === student.classId && fs.termId === activeTerm.id);
    const items = studentFees.map(fs => ({
      feeTypeId: fs.feeTypeId,
      feeTypeName: fs.feeTypeName,
      amount: fs.amount,
      paidAmount: idx % 3 === 0 ? fs.amount : (idx % 2 === 0 ? fs.amount * 0.5 : 0),
    }));
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const paidAmount = items.reduce((sum, i) => sum + i.paidAmount, 0);
    const balance = totalAmount - paidAmount;
    
    let status: Invoice["status"] = "unpaid";
    if (balance === 0) status = "paid";
    else if (paidAmount > 0) status = "partial";
    else if (new Date(activeTerm.dueDate) < new Date() && balance > 0) status = "overdue";
    
    invoices.push({
      id: `inv_${student.id}_${activeTerm.id}`,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      invoiceNumber: `INV-${activeTerm.academicYear}-${activeTerm.name.substring(0,1)}-${String(idx + 1).padStart(3, "0")}`,
      termId: activeTerm.id,
      termName: activeTerm.name,
      academicYear: activeTerm.academicYear,
      totalAmount,
      paidAmount,
      balance,
      status,
      dueDate: activeTerm.dueDate,
      createdAt: activeTerm.startDate,
      items,
    });
  });
  return invoices;
};

const mockFeeStructures = generateMockFeeStructures();
const mockInvoices: Invoice[] = generateMockInvoices(mockStudents, mockFeeStructures, mockTerms);

const mockPayments: Payment[] = [
  { id: "p1", studentId: "s1", studentName: "James Wilson", amount: 1500, method: "card", reference: "txn_card_123456", date: "2025-01-15", status: "confirmed", receiptNumber: "RCP-2025-001", invoiceId: "inv_s1_t1" },
  { id: "p2", studentId: "s2", studentName: "Sarah Johnson", amount: 500, method: "mobile_money", reference: "MM789012", date: "2025-01-20", status: "confirmed", receiptNumber: "RCP-2025-002", invoiceId: "inv_s2_t1" },
  { id: "p3", studentId: "s4", studentName: "Emily Davis", amount: 1600, method: "bank_transfer", reference: "BT345678", date: "2025-01-25", status: "confirmed", receiptNumber: "RCP-2025-003", invoiceId: "inv_s4_t1" },
  { id: "p4", studentId: "s5", studentName: "Daniel Martinez", amount: 1000, method: "cash", reference: "CASH001", date: "2025-01-28", status: "confirmed", receiptNumber: "RCP-2025-004", invoiceId: "inv_s5_t1" },
];

const mockStudentOverrides: StudentFeeOverride[] = [
  { id: "so1", studentId: "s2", studentName: "Sarah Johnson", feeTypeId: "ft2", feeTypeName: "Transport Fee", termId: "t1", termName: "Term 1", academicYear: "2025", amount: 0, reason: "Student walks to school" },
  { id: "so2", studentId: "s7", studentName: "Alexander Lee", feeTypeId: "ft5", feeTypeName: "Meals Fee", termId: "t1", termName: "Term 1", academicYear: "2025", amount: 150, reason: "Half-day student - reduced meals" },
];

// ==================== MAIN ADMIN COMPONENT ====================
export default function AdminFeesPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "feeTypes" | "feeStructures" | "studentOverrides" | "invoices" | "payments" | "dailyCollection" | "gateway">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState(mockTerms.find(t => t.isActive)?.id || "t1");
  
  // Modal states
  const [showFeeTypeModal, setShowFeeTypeModal] = useState(false);
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [showStudentOverrideModal, setShowStudentOverrideModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Form states
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money" | "bank_transfer" | "cash" | "cheque">("card");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Fee Type form
  const [newFeeType, setNewFeeType] = useState({ name: "", amount: 0, frequency: "termly" as const, category: "compulsory" as const });
  
  // Fee Structure form
  const [newFeeStructure, setNewFeeStructure] = useState({ classId: "", feeTypeId: "", amount: 0, termId: selectedTerm });
  
  // Gateway config
  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig>({
    isEnabled: true,
    provider: "stripe",
    publicKey: "pk_test_xxxxxxxxxxxxx",
    secretKey: "sk_test_xxxxxxxxxxxxx",
    webhookSecret: "whsec_xxxxxxxxxxxxx",
    testMode: true,
  });
  
  // Data states
  const [feeTypes, setFeeTypes] = useState<FeeType[]>(mockFeeTypes);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(mockFeeStructures);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [studentOverrides, setStudentOverrides] = useState<StudentFeeOverride[]>(mockStudentOverrides);
  const [students] = useState<Student[]>(mockStudents);
  const [terms] = useState<Term[]>(mockTerms);
  const [classes] = useState<Class[]>(mockClasses);
  
  // Daily collection data
  const today = new Date().toISOString().split("T")[0];
  const todayPayments = payments.filter(p => p.date === today && p.status === "confirmed");
  const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const weekPayments = payments.filter(p => {
    const paymentDate = new Date(p.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return paymentDate >= weekAgo && p.status === "confirmed";
  });
  const weekTotal = weekPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Statistics
  const totalCollected = payments.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalStudents = students.length;
  const overdueCount = invoices.filter(inv => inv.status === "overdue").length;
  const collectionRate = totalCollected + totalOutstanding > 0 ? ((totalCollected / (totalCollected + totalOutstanding)) * 100).toFixed(1) : "0";
  
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "all" || inv.className === selectedClass;
    const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle size={12} /> Paid</span>;
      case "partial": return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium"><Clock size={12} /> Partial</span>;
      case "overdue": return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium"><AlertCircle size={12} /> Overdue</span>;
      default: return <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs font-medium">Unpaid</span>;
    }
  };
  
  // Simulate payment processing
  const simulatePayment = async () => {
    if (!selectedInvoice || paymentAmount <= 0) return;
    
    setPaymentProcessing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate gateway response
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      // Update invoice
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === selectedInvoice.id) {
          const newPaidAmount = inv.paidAmount + paymentAmount;
          const newBalance = inv.totalAmount - newPaidAmount;
          let newStatus: Invoice["status"] = "unpaid";
          if (newBalance === 0) newStatus = "paid";
          else if (newPaidAmount > 0) newStatus = "partial";
          return { ...inv, paidAmount: newPaidAmount, balance: newBalance, status: newStatus };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
      
      // Add payment record
      const newPayment: Payment = {
        id: `p${payments.length + 1}`,
        studentId: selectedInvoice.studentId,
        studentName: selectedInvoice.studentName,
        amount: paymentAmount,
        method: paymentMethod,
        reference: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString().split("T")[0],
        status: "confirmed",
        receiptNumber: `RCP-${Date.now()}`,
        invoiceId: selectedInvoice.id,
      };
      setPayments([...payments, newPayment]);
      setPaymentSuccess(true);
      
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        setPaymentAmount(0);
      }, 2000);
    } else {
      alert("Payment failed. Please try again.");
    }
    
    setPaymentProcessing(false);
  };
  
  // Manual payment entry
  const handleManualPayment = () => {
    if (!selectedStudent) return;
    
    const newPayment: Payment = {
      id: `p${payments.length + 1}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      amount: paymentAmount,
      method: paymentMethod,
      reference: `MANUAL_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      status: "confirmed",
      receiptNumber: `RCP-${Date.now()}`,
      invoiceId: "",
    };
    setPayments([...payments, newPayment]);
    
    // Find and update invoice
    const studentInvoice = invoices.find(inv => inv.studentId === selectedStudent.id);
    if (studentInvoice) {
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === studentInvoice.id) {
          const newPaidAmount = inv.paidAmount + paymentAmount;
          const newBalance = inv.totalAmount - newPaidAmount;
          let newStatus: Invoice["status"] = "unpaid";
          if (newBalance === 0) newStatus = "paid";
          else if (newPaidAmount > 0) newStatus = "partial";
          return { ...inv, paidAmount: newPaidAmount, balance: newBalance, status: newStatus };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
    }
    
    setShowManualPaymentModal(false);
    setSelectedStudent(null);
    setPaymentAmount(0);
    alert(`Payment of $${paymentAmount} recorded successfully for ${selectedStudent.name}`);
  };
  
  // Add fee type
  const handleAddFeeType = () => {
    const newType: FeeType = {
      id: `ft${feeTypes.length + 1}`,
      name: newFeeType.name,
      amount: newFeeType.amount,
      frequency: newFeeType.frequency,
      category: newFeeType.category,
      taxRate: 0,
      glCode: `4${Math.floor(Math.random() * 900) + 100}`,
      isActive: true,
    };
    setFeeTypes([...feeTypes, newType]);
    setShowFeeTypeModal(false);
    setNewFeeType({ name: "", amount: 0, frequency: "termly", category: "compulsory" });
    alert(`Fee type "${newType.name}" added successfully!`);
  };
  
  // Add fee structure
  const handleAddFeeStructure = () => {
    const selectedClass = classes.find(c => c.id === newFeeStructure.classId);
    const selectedFeeType = feeTypes.find(ft => ft.id === newFeeStructure.feeTypeId);
    const selectedTerm = terms.find(t => t.id === newFeeStructure.termId);
    
    if (!selectedClass || !selectedFeeType || !selectedTerm) return;
    
    const newStructure: FeeStructure = {
      id: `fs_${newFeeStructure.classId}_${newFeeStructure.feeTypeId}_${newFeeStructure.termId}`,
      classId: newFeeStructure.classId,
      className: selectedClass.name,
      termId: newFeeStructure.termId,
      termName: selectedTerm.name,
      academicYear: selectedTerm.academicYear,
      feeTypeId: newFeeStructure.feeTypeId,
      feeTypeName: selectedFeeType.name,
      amount: newFeeStructure.amount,
    };
    setFeeStructures([...feeStructures, newStructure]);
    setShowFeeStructureModal(false);
    setNewFeeStructure({ classId: "", feeTypeId: "", amount: 0, termId: selectedTerm.id });
    alert(`Fee structure added for ${selectedClass.name} - ${selectedFeeType.name}`);
    
    // Regenerate invoices for affected students
    const affectedStudents = students.filter(s => s.classId === newFeeStructure.classId);
    const updatedInvoices = [...invoices];
    affectedStudents.forEach(student => {
      const existingInvoice = updatedInvoices.find(inv => inv.studentId === student.id);
      if (existingInvoice) {
        const newItem = {
          feeTypeId: newFeeStructure.feeTypeId,
          feeTypeName: selectedFeeType.name,
          amount: newFeeStructure.amount,
          paidAmount: 0,
        };
        existingInvoice.items.push(newItem);
        existingInvoice.totalAmount += newFeeStructure.amount;
        existingInvoice.balance += newFeeStructure.amount;
        if (existingInvoice.balance > 0 && existingInvoice.paidAmount > 0) existingInvoice.status = "partial";
        else if (existingInvoice.balance > 0) existingInvoice.status = "unpaid";
      }
    });
    setInvoices(updatedInvoices);
  };
  
  // Add student override
  const handleAddStudentOverride = () => {
    const newOverride: StudentFeeOverride = {
      id: `so${studentOverrides.length + 1}`,
      studentId: selectedStudent?.id || "",
      studentName: selectedStudent?.name || "",
      feeTypeId: newFeeStructure.feeTypeId,
      feeTypeName: feeTypes.find(ft => ft.id === newFeeStructure.feeTypeId)?.name || "",
      termId: selectedTerm,
      termName: terms.find(t => t.id === selectedTerm)?.name || "",
      academicYear: terms.find(t => t.id === selectedTerm)?.academicYear || "",
      amount: newFeeStructure.amount,
      reason: "Special arrangement",
    };
    setStudentOverrides([...studentOverrides, newOverride]);
    setShowStudentOverrideModal(false);
    setSelectedStudent(null);
    alert(`Override added for ${newOverride.studentName}`);
  };
  
  // Save gateway config
  const handleSaveGateway = () => {
    setShowGatewayModal(false);
    alert(`Payment gateway configured with ${gatewayConfig.provider.toUpperCase()} in ${gatewayConfig.testMode ? "TEST" : "LIVE"} mode`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <DollarSign className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fees Management System</h1>
                <p className="text-xs text-gray-500">Academic Year 2025 • {terms.find(t => t.isActive)?.name || "Term 1"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 border-l pl-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-500">admin@school.com</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">A</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar + Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16">
          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutGrid, color: "text-gray-500" },
              { id: "feeTypes", label: "Fee Types", icon: Tag, color: "text-gray-500" },
              { id: "feeStructures", label: "Fee Structures", icon: Layers, color: "text-gray-500" },
              { id: "studentOverrides", label: "Student Overrides", icon: UserPlus, color: "text-gray-500" },
              { id: "invoices", label: "Invoices", icon: FileText, color: "text-gray-500" },
              { id: "payments", label: "Payments", icon: CreditCard, color: "text-gray-500" },
              { id: "dailyCollection", label: "Daily Collection", icon: Calendar, color: "text-gray-500" },
              { id: "gateway", label: "Payment Gateway", icon: Settings, color: "text-gray-500" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 max-w-[calc(100%-16rem)]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            
            {/* ==================== DASHBOARD TAB ==================== */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Collected</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">${totalCollected.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12% from last term</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-green-600" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">${totalOutstanding.toLocaleString()}</p>
                        <p className="text-xs text-red-600 mt-1">{overdueCount} students overdue</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="text-red-600" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Collection Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{collectionRate}%</p>
                        <p className="text-xs text-gray-500 mt-1">Target: 95%</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="text-blue-600" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
                        <p className="text-xs text-gray-500 mt-1">Active enrollments</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="text-purple-600" size={24} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Collection by Fee Type</h3>
                    <div className="space-y-3">
                      {feeTypes.slice(0, 5).map(ft => {
                        const collected = payments.filter(p => {
                          const inv = invoices.find(i => i.id === p.invoiceId);
                          return inv?.items.some(item => item.feeTypeId === ft.id);
                        }).reduce((sum, p) => sum + p.amount, 0);
                        const total = feeStructures.filter(fs => fs.feeTypeId === ft.id).reduce((sum, fs) => sum + fs.amount, 0);
                        const percentage = total > 0 ? (collected / total) * 100 : 0;
                        return (
                          <div key={ft.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{ft.name}</span>
                              <span>${collected.toLocaleString()} / ${total.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map(payment => (
                        <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">{payment.studentName}</p>
                            <p className="text-xs text-gray-500 capitalize">{payment.method} • {payment.receiptNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">${payment.amount}</p>
                            <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">View All <ChevronRight size={14} /></button>
                  </div>
                </div>
                
                {/* Overdue Students */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Overdue Students</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"><Send size={14} /> Send Bulk Reminders</button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {invoices.filter(inv => inv.status === "overdue").map(inv => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{inv.studentName}</p>
                          <p className="text-xs text-gray-500">{inv.className} • Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-semibold text-red-600">${inv.balance}</p>
                          <button 
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentAmount(inv.balance);
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Record Payment
                          </button>
                          <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Send SMS</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* ==================== FEE TYPES TAB ==================== */}
            {activeTab === "feeTypes" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Fee Types</h2>
                  <button 
                    onClick={() => setShowFeeTypeModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Fee Type
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GL Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {feeTypes.map(ft => (
                        <tr key={ft.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{ft.name}</td>
                          <td className="px-6 py-4 text-sm">${ft.amount}</td>
                          <td className="px-6 py-4 text-sm capitalize">{ft.frequency}</td>
                          <td className="px-6 py-4 text-sm capitalize">{ft.category}</td>
                          <td className="px-6 py-4 text-sm">{ft.glCode}</td>
                          <td className="px-6 py-4">{ft.isActive ? <span className="text-green-600 text-sm">Active</span> : <span className="text-red-600 text-sm">Inactive</span>}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-1 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                              <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* ==================== FEE STRUCTURES TAB ==================== */}
            {activeTab === "feeStructures" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Fee Structures by Class</h2>
                  <button 
                    onClick={() => setShowFeeStructureModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={16} /> Assign Structure
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {feeStructures.filter(fs => fs.termId === selectedTerm).map(fs => (
                        <tr key={fs.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{fs.className}</td>
                          <td className="px-6 py-4 text-sm">{fs.termName} {fs.academicYear}</td>
                          <td className="px-6 py-4 text-sm">{fs.feeTypeName}</td>
                          <td className="px-6 py-4 text-sm">${fs.amount}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-1 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                              <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* ==================== STUDENT OVERRIDES TAB ==================== */}
            {activeTab === "studentOverrides" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Student-Specific Fee Overrides</h2>
                  <button 
                    onClick={() => setShowStudentOverrideModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Override
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Override Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentOverrides.map(so => (
                        <tr key={so.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{so.studentName}</td>
                          <td className="px-6 py-4 text-sm">{so.feeTypeName}</td>
                          <td className="px-6 py-4 text-sm">{so.termName} {so.academicYear}</td>
                          <td className="px-6 py-4 text-sm font-medium">${so.amount}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{so.reason}</td>
                          <td className="px-6 py-4">
                            <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* ==================== INVOICES TAB ==================== */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search by student name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg">
                      <option value="all">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg">
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply Filters</button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"><Download size={16} /> Export</button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-blue-600">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{invoice.studentName}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{invoice.className}</td>
                          <td className="px-6 py-4 text-sm font-medium">${invoice.totalAmount}</td>
                          <td className="px-6 py-4 text-sm text-green-600">${invoice.paidAmount}</td>
                          <td className="px-6 py-4 text-sm font-medium text-red-600">${invoice.balance}</td>
                          <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-1 text-gray-400 hover:text-blue-600"><Printer size={16} /></button>
                              <button 
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPaymentAmount(invoice.balance);
                                  setShowPaymentModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-green-600"
                                disabled={invoice.balance === 0}
                              >
                                <CreditCard size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* ==================== PAYMENTS TAB ==================== */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Payment Transactions</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"><Download size={16} /> Export to Excel</button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{payment.receiptNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{payment.studentName}</td>
                        <td className="px-6 py-4 text-sm font-semibold">${payment.amount}</td>
                        <td className="px-6 py-4 text-sm capitalize">{payment.method.replace("_", " ")}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{payment.reference}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {payment.status === "confirmed" ? (
                            <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle size={12} /> Confirmed</span>
                          ) : (
                            <span className="text-yellow-600 text-sm">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowReceiptModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Receipt size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* ==================== DAILY COLLECTION TAB ==================== */}
            {activeTab === "dailyCollection" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-sm opacity-90">Today's Collection</p>
                    <p className="text-3xl font-bold mt-2">${todayTotal.toLocaleString()}</p>
                    <p className="text-xs opacity-80 mt-1">{todayPayments.length} transactions</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-sm opacity-90">This Week</p>
                    <p className="text-3xl font-bold mt-2">${weekTotal.toLocaleString()}</p>
                    <p className="text-xs opacity-80 mt-1">Last 7 days</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm text-gray-500">Average Daily Collection</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">${(weekTotal / 7).toFixed(0)}</p>
                    <p className="text-xs text-gray-400 mt-1">Based on last 7 days</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Today's Payments</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {todayPayments.length > 0 ? todayPayments.map(payment => (
                      <div key={payment.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{payment.studentName}</p>
                          <p className="text-xs text-gray-500 capitalize">{payment.method} • Ref: {payment.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${payment.amount}</p>
                          <p className="text-xs text-gray-500">{payment.receiptNumber}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-gray-500">No payments recorded today</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Manual Payment Entry</h3>
                  <div className="flex gap-4">
                    <select 
                      onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value) || null)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Amount"
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-32 px-4 py-2 border border-gray-200 rounded-lg"
                    />
                    <button 
                      onClick={() => setShowManualPaymentModal(true)}
                      disabled={!selectedStudent || paymentAmount <= 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* ==================== PAYMENT GATEWAY TAB ==================== */}
            {activeTab === "gateway" && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Payment Gateway Configuration</h2>
                      <p className="text-sm text-gray-500">Configure your payment processor for online collections</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Enable Online Payments</p>
                        <p className="text-sm text-gray-500">Allow parents to pay fees online via the parent portal</p>
                      </div>
                      <button 
                        onClick={() => setGatewayConfig({ ...gatewayConfig, isEnabled: !gatewayConfig.isEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gatewayConfig.isEnabled ? "bg-blue-600" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gatewayConfig.isEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Provider</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "stripe", name: "Stripe", icon: "💳" },
                          { id: "paystack", name: "Paystack", icon: "🌍" },
                          { id: "flutterwave", name: "Flutterwave", icon: "🌊" },
                        ].map(provider => (
                          <button
                            key={provider.id}
                            onClick={() => setGatewayConfig({ ...gatewayConfig, provider: provider.id as any })}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${gatewayConfig.provider === provider.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                          >
                            <span className="text-2xl">{provider.icon}</span>
                            <p className="text-sm font-medium mt-1">{provider.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Public / Publishable Key</label>
                      <input
                        type="text"
                        value={gatewayConfig.publicKey}
                        onChange={(e) => setGatewayConfig({ ...gatewayConfig, publicKey: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                        placeholder="pk_test_..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                      <input
                        type="password"
                        value={gatewayConfig.secretKey}
                        onChange={(e) => setGatewayConfig({ ...gatewayConfig, secretKey: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                        placeholder="sk_test_..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                      <input
                        type="text"
                        value={gatewayConfig.webhookSecret}
                        onChange={(e) => setGatewayConfig({ ...gatewayConfig, webhookSecret: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                        placeholder="whsec_..."
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">Test Mode</p>
                        <p className="text-sm text-yellow-700">No real payments will be processed</p>
                      </div>
                      <button 
                        onClick={() => setGatewayConfig({ ...gatewayConfig, testMode: !gatewayConfig.testMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gatewayConfig.testMode ? "bg-yellow-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gatewayConfig.testMode ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={handleSaveGateway}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Save Configuration
                    </button>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 flex items-start gap-2">
                        <CheckCircle size={16} className="mt-0.5" />
                        <span>Webhook URL for payment notifications: <code className="bg-white px-2 py-1 rounded text-xs">https://yourdomain.com/api/webhooks/payment</code></span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ==================== MODALS ==================== */}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Make Payment</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedInvoice.invoiceNumber} - {selectedInvoice.studentName}</p>
              </div>
              <button onClick={() => { setShowPaymentModal(false); setPaymentSuccess(false); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            {paymentSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-500">Your payment of ${paymentAmount} has been processed.</p>
                <p className="text-sm text-gray-400 mt-2">Receipt sent to parent email</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Outstanding Balance</span>
                      <span className="font-semibold">${selectedInvoice.balance}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Amount</span>
                      <span className="font-semibold text-blue-600">${paymentAmount}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "card", label: "Card", icon: <CreditCard size={18} /> },
                        { id: "mobile_money", label: "Mobile Money", icon: <Smartphone size={18} /> },
                        { id: "bank_transfer", label: "Bank Transfer", icon: <Send size={18} /> },
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-all ${paymentMethod === method.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          {method.icon}
                          <span className="text-xs">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      <input type="text" placeholder="Card Number" className="w-full px-4 py-2 border border-gray-200 rounded-lg" defaultValue="4242 4242 4242 4242" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="MM/YY" className="px-4 py-2 border border-gray-200 rounded-lg" defaultValue="12/28" />
                        <input type="text" placeholder="CVC" className="px-4 py-2 border border-gray-200 rounded-lg" defaultValue="123" />
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === "mobile_money" && (
                    <input type="tel" placeholder="Phone Number (e.g., 2547XXXXXXXX)" className="w-full px-4 py-2 border border-gray-200 rounded-lg" defaultValue="254712345678" />
                  )}
                  
                  {paymentMethod === "bank_transfer" && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">Bank Details:</p>
                      <p>Bank: Example Bank</p>
                      <p>Account: 1234567890</p>
                      <p>Reference: {selectedInvoice.invoiceNumber}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Cancel</button>
                  <button 
                    onClick={simulatePayment}
                    disabled={paymentProcessing}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? <RefreshCw size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    {paymentProcessing ? "Processing..." : `Pay $${paymentAmount}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Manual Payment Modal */}
      {showManualPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Manual Payment Entry</h3>
              <button onClick={() => setShowManualPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                <p className="text-sm text-gray-500">{selectedStudent.className} • {selectedStudent.studentId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference (Optional)</label>
                <input type="text" placeholder="Cheque # or Transaction ID" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowManualPaymentModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Cancel</button>
              <button onClick={handleManualPayment} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">Record Payment</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fee Type Modal */}
      {showFeeTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Fee Type</h3>
              <button onClick={() => setShowFeeTypeModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Fee Name" value={newFeeType.name} onChange={(e) => setNewFeeType({ ...newFeeType, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="number" placeholder="Amount" value={newFeeType.amount || ""} onChange={(e) => setNewFeeType({ ...newFeeType, amount: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <select value={newFeeType.frequency} onChange={(e) => setNewFeeType({ ...newFeeType, frequency: e.target.value as any })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="termly">Termly</option>
                <option value="monthly">Monthly</option>
                <option value="one-time">One Time</option>
              </select>
              <select value={newFeeType.category} onChange={(e) => setNewFeeType({ ...newFeeType, category: e.target.value as any })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="compulsory">Compulsory</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowFeeTypeModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Cancel</button>
              <button onClick={handleAddFeeType} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">Add Fee Type</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fee Structure Modal */}
      {showFeeStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Assign Fee Structure</h3>
              <button onClick={() => setShowFeeStructureModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <select value={newFeeStructure.classId} onChange={(e) => setNewFeeStructure({ ...newFeeStructure, classId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={newFeeStructure.feeTypeId} onChange={(e) => setNewFeeStructure({ ...newFeeStructure, feeTypeId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="">Select Fee Type</option>
                {feeTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name} (${ft.amount})</option>)}
              </select>
              <select value={newFeeStructure.termId} onChange={(e) => setNewFeeStructure({ ...newFeeStructure, termId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.academicYear}</option>)}
              </select>
              <input type="number" placeholder="Amount (override)" value={newFeeStructure.amount || ""} onChange={(e) => setNewFeeStructure({ ...newFeeStructure, amount: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowFeeStructureModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Cancel</button>
              <button onClick={handleAddFeeStructure} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">Assign Structure</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Student Override Modal */}
      {showStudentOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Student Fee Override</h3>
              <button onClick={() => setShowStudentOverrideModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <select onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value) || null)} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
              </select>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                <option value="">Select Fee Type</option>
                {feeTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
              </select>
              <input type="number" placeholder="Override Amount" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="text" placeholder="Reason (e.g., Scholarship, Sibling Discount)" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowStudentOverrideModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Cancel</button>
              <button onClick={handleAddStudentOverride} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">Add Override</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Payment Receipt</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt size={32} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">${selectedPayment.amount}</p>
              <p className="text-sm text-gray-500 mt-1">Receipt: {selectedPayment.receiptNumber}</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left space-y-1 text-sm">
                <p><span className="text-gray-500">Student:</span> {selectedPayment.studentName}</p>
                <p><span className="text-gray-500">Date:</span> {new Date(selectedPayment.date).toLocaleDateString()}</p>
                <p><span className="text-gray-500">Method:</span> {selectedPayment.method}</p>
                <p><span className="text-gray-500">Reference:</span> {selectedPayment.reference}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}