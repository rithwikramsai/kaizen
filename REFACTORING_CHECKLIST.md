# 🛡️ UI-ONLY REFACTORING CHECKLIST

## ⚠️ CRITICAL RULES

**BEFORE changing ANY file:**
1. ✅ Read the entire component first
2. ✅ Identify all business logic (handlers, state, effects)
3. ✅ Mark logic as "DO NOT TOUCH"
4. ✅ Only modify visual elements

**AFTER each change:**
1. ✅ Test the feature manually
2. ✅ Verify all buttons/links work
3. ✅ Check forms still submit
4. ✅ Confirm data loads correctly

---

## 📋 PAGE-BY-PAGE CHECKLIST

### **1. LoginPage.tsx**

**Identify Logic to Preserve:**
- [ ] `useAuth()` hook
- [ ] `useForm()` with zod validation
- [ ] `handleSubmit` function
- [ ] `login(email, password)` API call
- [ ] `navigate('/ideas')` after success
- [ ] `setServerError` state
- [ ] `handleForgotPassword` function
- [ ] Microsoft SSO redirect

**Visual Changes Only:**
- [ ] Replace `background: '#0e0e12'` → `className="bg-neutral-50"`
- [ ] Remove floating particles array (lines 509-528)
- [ ] Remove `useTilt` hook (lines 21-33)
- [ ] Remove 3D tilt effects on buttons
- [ ] Replace red gradient → `bg-white` for form card
- [ ] Update button: `bg-acg-500 hover:bg-acg-600`
- [ ] Remove cursor spotlight effect (lines 259-266)
- [ ] Simplify stat cards (remove 3D tilt)

**Test After Changes:**
- [ ] Email/password login works
- [ ] Validation shows errors
- [ ] "Remember me" checkbox works
- [ ] "Forgot password" flow works
- [ ] Microsoft SSO redirect works
- [ ] "Submit anonymously" navigation works
- [ ] Error messages display correctly

---

### **2. Layout.tsx**

**Identify Logic to Preserve:**
- [ ] `useAuth()` - user, logout, hasPermission
- [ ] `useQuery()` for notifications
- [ ] `navigate()` routing
- [ ] `handleLogout` function
- [ ] Permission-based nav rendering
- [ ] `<Outlet />` for child routes

**Visual Changes Only:**
- [ ] Replace sidebar: `background: 'rgba(9,9,15,0.96)'` → `bg-white border-r border-neutral-200`
- [ ] Remove red glow overlay (lines 564-568)
- [ ] Replace nav active state: comet animation → simple `bg-acg-50 border-l-3 border-acg-500`
- [ ] Remove `.nav-active::after` comet (lines 62-88)
- [ ] Update topbar: dark → `bg-white border-b border-neutral-200`
- [ ] Update bell badge: keep count logic, restyle color
- [ ] Update avatar: keep initials logic, restyle gradient

**Test After Changes:**
- [ ] All nav links navigate correctly
- [ ] Active page highlights properly
- [ ] Permission-based nav hiding works
- [ ] Notification count updates
- [ ] Logout button works
- [ ] User dropdown shows correct info
- [ ] Mobile responsive (if applicable)

---

### **3. DashboardPage.tsx**

**Identify Logic to Preserve:**
- [ ] `useQuery()` for dashboard data
- [ ] `getDashboardData` API call
- [ ] `isLoading`, `isError` states
- [ ] Data mapping to KPI cards

**Visual Changes Only:**
- [ ] Update KPI cards: dark glass → `bg-white border border-neutral-200 shadow-sm`
- [ ] Remove 3D tilt on cards (if present)
- [ ] Update accent colors: keep logic, change values
- [ ] Update typography: make hierarchy clearer

**Test After Changes:**
- [ ] Dashboard data loads
- [ ] Loading skeleton shows
- [ ] Error state displays
- [ ] Numbers are correct
- [ ] Cards are clickable (if applicable)

---

### **4. IdeasListPage.tsx**

**Identify Logic to Preserve:**
- [ ] `useQuery()` with pagination
- [ ] `listIdeas()` API call
- [ ] `page`, `statusFilter` state
- [ ] Filter button handlers
- [ ] Navigation to detail pages

**Visual Changes Only:**
- [ ] Update page background
- [ ] Restyle filter chips
- [ ] Update card backgrounds
- [ ] Change status badge colors
- [ ] Update empty state styling

**Test After Changes:**
- [ ] Ideas load correctly
- [ ] Pagination works
- [ ] Filters apply correctly
- [ ] Clicking card navigates
- [ ] Status badges show correct state

---

### **5. IdeaDetailPage.tsx**

**Identify Logic to Preserve:**
- [ ] `useQuery()` for idea data
- [ ] `useQuery()` for workflow status
- [ ] `useMutation()` for actions
- [ ] `handleSubmit` workflow actions
- [ ] HOD flags logic
- [ ] Permission checks
- [ ] File download handlers

**Visual Changes Only:**
- [ ] Update page container
- [ ] Restyle detail cards
- [ ] Update status badges
- [ ] Restyle action buttons
- [ ] Update workflow timeline
- [ ] Change comment section styling

**Test After Changes:**
- [ ] Idea data loads
- [ ] Workflow timeline displays
- [ ] Approve/Reject/Return buttons work
- [ ] Comment submission works
- [ ] File attachments download
- [ ] HOD flags can be set
- [ ] Navigation back works

---

## 🚨 RED FLAGS - STOP IF YOU SEE THESE

**If you're about to change ANY of these, STOP:**
- ❌ `useState()` declarations
- ❌ `useEffect()` hooks
- ❌ `useMutation()` or `useQuery()` configurations
- ❌ Event handler functions (`onClick={() => ...}`)
- ❌ API calls or fetch functions
- ❌ Form validation schemas (Zod)
- ❌ `navigate()` calls
- ❌ Context providers
- ❌ Props being passed
- ❌ Conditional rendering logic

**Safe to change:**
- ✅ `style={{ ... }}` inline styles
- ✅ `className="..."` CSS classes
- ✅ Color values, spacing, typography
- ✅ Decorative elements (particles, animations)
- ✅ SVG icons (keep paths, change colors)
- ✅ Layout divs (keep structure, change styles)

---

## 🧪 TESTING PROTOCOL

**After Each Component:**

1. **Visual Test:**
   - [ ] Looks professional
   - [ ] ACG red used sparingly
   - [ ] Text is readable
   - [ ] Spacing is consistent

2. **Functional Test:**
   - [ ] All buttons clickable
   - [ ] Forms submit correctly
   - [ ] Data loads and displays
   - [ ] Navigation works
   - [ ] Errors show properly

3. **Regression Test:**
   - [ ] Features from BRD still work
   - [ ] User permissions respected
   - [ ] Workflow actions execute
   - [ ] Files upload/download

---

## 📊 PROGRESS TRACKING

### Phase 1: Foundation ✅
- [x] Design tokens created
- [x] Tailwind config updated
- [x] Base CSS created
- [x] Global styles applied

### Phase 2: Core Pages
- [ ] LoginPage.tsx
- [ ] Layout.tsx (nav + topbar)
- [ ] DashboardPage.tsx

### Phase 3: Feature Pages
- [ ] IdeasListPage.tsx
- [ ] MyIdeasPage.tsx
- [ ] IdeaDetailPage.tsx
- [ ] IdeaSubmitPage.tsx
- [ ] IdeaEditPage.tsx

### Phase 4: Workflow Pages
- [ ] ReviewQueuePage.tsx
- [ ] KaizenOnePagerPage.tsx
- [ ] ApprovedQueuePage.tsx

### Phase 5: Rewards Pages
- [ ] RewardsQueuePage.tsx
- [ ] LeaderboardPage.tsx
- [ ] SCRatingPage.tsx

### Phase 6: Admin Pages
- [ ] AdminDashboardPage.tsx
- [ ] UserManagementPage.tsx
- [ ] MasterDataPage.tsx

### Phase 7: Components
- [ ] WorkflowTimeline.tsx
- [ ] FileUpload.tsx
- [ ] EmptyState.tsx
- [ ] Skeleton.tsx

---

## ✅ SIGN-OFF CRITERIA

**Each page is DONE when:**
1. ✅ All visual changes applied
2. ✅ All features tested and working
3. ✅ No console errors
4. ✅ ACG brand colors used correctly
5. ✅ Professional appearance confirmed
6. ✅ Stakeholder approval (optional)

---

## 🆘 IF SOMETHING BREAKS

**Recovery Steps:**
1. Revert the file: `git checkout HEAD -- path/to/file.tsx`
2. Identify what broke (check console errors)
3. Make smaller, incremental changes
4. Test after each small change
5. Commit working versions frequently

**Git Strategy:**
```bash
# Before starting each page
git checkout -b refactor/login-page-ui

# After page is done and tested
git add packages/frontend/src/pages/LoginPage.tsx
git commit -m "refactor(ui): LoginPage light theme - no logic changes"

# If issues arise
git revert HEAD
```

---

## 📝 NOTES

**Remember:**
- This is CSS-only refactoring
- Zero backend changes
- All features must continue working
- Test after every change
- Small commits, easy rollback
