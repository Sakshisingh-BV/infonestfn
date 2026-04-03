package com.infonest.service; // Resolves: declared package "" does not match
import com.infonest.model.Schedules;
import com.infonest.model.VenueBooking;
import com.infonest.repository.ScheduleRepository;
import com.infonest.repository.VenueBookingRepository;
import com.infonest.repository.UserRepository;
import com.infonest.model.User;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleRepository repository;

    @Autowired
    private VenueBookingRepository venueBookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(rollbackFor = Exception.class)
    public void importExcel(MultipartFile file, String email, String teacherName, boolean isUpdate) throws Exception {
        // 1. Wipe existing schedule to avoid duplicates
        repository.deleteByEmail(email);

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        boolean isCsv = (originalFilename != null && originalFilename.toLowerCase().endsWith(".csv"))
                || "text/csv".equalsIgnoreCase(contentType)
                || "application/vnd.ms-excel".equalsIgnoreCase(contentType) && (originalFilename != null && originalFilename.toLowerCase().endsWith(".csv"));

        List<Schedules> list;

        if (isCsv) {
            list = parseCsvFile(file, email, teacherName);
        } else {
            list = parseExcelFile(file, email, teacherName);
        }

        if (list.isEmpty()) {
            throw new IllegalArgumentException("No valid schedule entries found in the uploaded file.");
        }

        repository.saveAll(list);
    }

    /**
     * Parse CSV file — columns: Teacher Name, Day, Subject, Batch, Room, Start Time, End Time, Cabin
     */
    private List<Schedules> parseCsvFile(MultipartFile file, String email, String teacherName) throws Exception {
        List<Schedules> list = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("H:mm[:ss]");

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                // Skip empty lines
                if (line.trim().isEmpty()) continue;

                // Skip header row
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }

                // Split by comma — handle quoted values
                String[] cols = splitCsvLine(line);

                if (cols.length < 7) continue; // Need at least 7 columns

                // Col 0 = Teacher Name (we use UI-provided name instead)
                if (cols[0].trim().isEmpty()) continue;

                String day = cols[1].trim().toUpperCase();
                if ("TUESDAY".equals(day)) continue;

                Schedules s = new Schedules();
                s.setEmail(email);
                s.setTeacherName(teacherName);
                s.setDayOfWeek(day);                    // Col 1
                s.setSubject(cols[2].trim());            // Col 2
                s.setBatchName(cols[3].trim());          // Col 3
                s.setRoomNo(cols[4].trim());             // Col 4

                String startStr = cols[5].trim();        // Col 5
                String endStr = cols[6].trim();          // Col 6
                s.setStartTime(LocalTime.parse(startStr, timeFormatter));
                s.setEndTime(LocalTime.parse(endStr, timeFormatter));

                // Col 7 = Cabin (optional)
                s.setSittingCabin(cols.length > 7 ? cols[7].trim() : "");

                list.add(s);
            }
        }
        return list;
    }

    /**
     * Split a CSV line handling quoted fields with commas inside them
     */
    private String[] splitCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }

    /**
     * Parse Excel (.xlsx / .xls) file using WorkbookFactory (auto-detects format)
     */
    private List<Schedules> parseExcelFile(MultipartFile file, String email, String teacherName) throws Exception {
        List<Schedules> list = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("H:mm[:ss]");

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip Header

                if (row.getCell(0) == null || formatter.formatCellValue(row.getCell(0)).isEmpty()) continue;

                String day = formatter.formatCellValue(row.getCell(1)).trim().toUpperCase();
                if ("TUESDAY".equals(day)) continue;

                Schedules s = new Schedules();
                s.setEmail(email);
                s.setTeacherName(teacherName);
                s.setDayOfWeek(day);
                s.setSubject(formatter.formatCellValue(row.getCell(2)).trim());
                s.setBatchName(formatter.formatCellValue(row.getCell(3)).trim());
                s.setRoomNo(formatter.formatCellValue(row.getCell(4)).trim());

                String startStr = formatter.formatCellValue(row.getCell(5)).trim();
                String endStr = formatter.formatCellValue(row.getCell(6)).trim();
                s.setStartTime(LocalTime.parse(startStr, timeFormatter));
                s.setEndTime(LocalTime.parse(endStr, timeFormatter));

                s.setSittingCabin(formatter.formatCellValue(row.getCell(7)).trim());

                list.add(s);
            }
        }
        return list;
    }

@Transactional
public void deleteTeacherSchedule(String email) {
    System.out.println("Attempting to delete schedule for email: [" + email + "]");
    repository.deleteByEmail(email.trim());
    // The transaction will handle the commit automatically
}

    // Try several heuristics to locate a manageable teacher record from uploaded name/email
    public List<User> findMatchingUsers(String raw) {
        String q = raw == null ? "" : raw.trim();
        Set<User> results = new HashSet<>();

        // 1) If looks like an email, try exact email match first
        if (q.contains("@")) {
            userRepository.findByEmail(q).ifPresent(u -> {
                if (!"STUDENT".equalsIgnoreCase(u.getRole()) && !"OFFICE".equalsIgnoreCase(u.getRole())) {
                    results.add(u);
                }
            });
            if (!results.isEmpty()) return new ArrayList<>(results);
        }

        // 2) Try the existing searchable query (searches firstName/lastName/email via LIKE)
        List<User> list = userRepository.searchManageableTeachers(q);
        if (list != null && !list.isEmpty()) return list;

        // 3) Tokenize the input (split by whitespace/comma) and try each token
        String[] tokens = q.split("\\s+|,");
        for (String t : tokens) {
            t = t.trim();
            if (t.isEmpty()) continue;
            list = userRepository.searchManageableTeachers(t);
            if (list != null) results.addAll(list);
        }
        if (!results.isEmpty()) return new ArrayList<>(results);

        // 4) If two tokens, also try swapped order ("Last First" -> "First Last" attempts)
        if (tokens.length == 2) {
            String swapped = tokens[1] + " " + tokens[0];
            list = userRepository.searchManageableTeachers(swapped);
            if (list != null && !list.isEmpty()) return list;
        }

        return new ArrayList<>();
    }

    public String getRealTimeStatus(String name) {
        LocalTime now = LocalTime.now();
        LocalDate today = LocalDate.now();
        DayOfWeek day = today.getDayOfWeek();

        // PRIORITY 1: Check for active venue bookings (Override all time/day restrictions)
        List<VenueBooking> activeBookings = venueBookingRepository.findActiveBookingByTeacher(name, today, now);
        if (!activeBookings.isEmpty()) {
            VenueBooking booking = activeBookings.get(0); // Get the first active booking
            return "📍 " + name + " is in " + booking.getVenue().getName() + 
                   " (Booked: " + booking.getStartTime() + " - " + booking.getEndTime() + ")";
        }

        // PRIORITY 2: Check regular schedule (with time/day restrictions)
        // Fix: Your college is off on Tuesdays
        if (day == DayOfWeek.TUESDAY) {
            return "Tuesdays are off! Enjoy your holiday.";
        }

        // Working Hours Check (9-5)
        if (now.isBefore(LocalTime.of(9, 0)) || now.isAfter(LocalTime.of(17, 0))) {
            return "College is closed. Staff available 9 AM - 5 PM.";
        }

        return repository.findCurrentLocation(name, day.toString().toUpperCase(), now)
        .map(s -> "📍 " + s.getTeacherName() + " is in " + s.getRoomNo() + 
                  " taking " + s.getSubject() + " for Batch: " + s.getBatchName())
        .orElse("No active class at this time. Please check Sitting Cabin.");
    }

            public String getTeacherCabin(String name) {
                // DISTICT prevents the 500 error if a teacher has multiple entries
                return repository.findSittingCabin(name)
                        .map(cabin -> "Staff Cabin: " + cabin)
                        .orElse("Cabin information not found for " + name);
            }
}