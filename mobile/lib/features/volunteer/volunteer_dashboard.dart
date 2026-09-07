// FoodRescue AI — Volunteer Dashboard

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/deliveries_provider.dart';
import '../../models/app_models.dart';
import 'package:intl/intl.dart';

class VolunteerDashboard extends ConsumerStatefulWidget {
  const VolunteerDashboard({super.key});

  @override
  ConsumerState<VolunteerDashboard> createState() => _VolunteerDashboardState();
}

class _VolunteerDashboardState extends ConsumerState<VolunteerDashboard>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(_load);
  }

  Future<void> _load() async {
    final user = ref.read(authProvider).user;
    await ref.read(deliveriesProvider.notifier).fetchTasks();
    if (user != null) {
      await ref.read(deliveriesProvider.notifier).fetchTasks(volunteerId: user.id);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(deliveriesProvider);

    final myTasks = state.deliveries.where((d) => d.volunteerId == user?.id).toList();
    final available = state.deliveries.where((d) => d.volunteerId == null).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Volunteer Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded),
            onPressed: () => context.push('/history'),
          ),
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            onPressed: () => context.push('/analytics'),
          ),
          PopupMenuButton(
            itemBuilder: (ctx) => [
              PopupMenuItem(
                onTap: () => ref.read(authProvider.notifier).logout().then((_) => context.go('/')),
                child: const Text('Logout'),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Available (${available.length})'),
            Tab(text: 'My Tasks (${myTasks.length})'),
          ],
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                controller: _tabController,
                children: [
                  _TaskList(tasks: available, showAccept: true),
                  _TaskList(tasks: myTasks, showAccept: false),
                ],
              ),
      ),
    );
  }
}

class _TaskList extends StatelessWidget {
  final List<Delivery> tasks;
  final bool showAccept;
  const _TaskList({required this.tasks, required this.showAccept});

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.delivery_dining, size: 64, color: AppTheme.textHint),
            SizedBox(height: 16),
            Text('No tasks available', style: TextStyle(color: AppTheme.textHint)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: tasks.length,
      itemBuilder: (ctx, i) => _TaskCard(task: tasks[i], showAccept: showAccept),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final Delivery task;
  final bool showAccept;
  const _TaskCard({required this.task, required this.showAccept});

  @override
  Widget build(BuildContext context) {
    final donation = task.donation;
    final statusColor = AppTheme.statusColor(task.status);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => context.push('/volunteer/task/${task.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.delivery_dining, color: AppTheme.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      donation?.foodName ?? 'Delivery Task',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(20),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: statusColor.withAlpha(60)),
                    ),
                    child: Text(
                      AppTheme.statusLabel(task.status),
                      style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              if (donation != null) ...[
                const SizedBox(height: 6),
                Text(
                  '${donation.quantity} meals • ${donation.weightKg} kg • ${donation.category}',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textHint),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        donation.pickupAddress,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textHint),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.timer_outlined, size: 13, color: AppTheme.textHint),
                    const SizedBox(width: 4),
                    Text(
                      donation.isExpired
                          ? 'Window expired'
                          : '${donation.remainingWindowMinutes ~/ 60}h ${donation.remainingWindowMinutes % 60}m remaining',
                      style: TextStyle(
                        fontSize: 12,
                        color: donation.isExpired ? AppTheme.statusBlocked
                            : donation.remainingWindowMinutes < 60 ? AppTheme.amber
                            : AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.push('/volunteer/task/${task.id}'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 38),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      child: const Text('View Details'),
                    ),
                  ),
                  if (showAccept) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => context.push('/volunteer/task/${task.id}'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 38),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        child: const Text('Accept'),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
